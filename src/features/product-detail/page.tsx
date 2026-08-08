import { useEffect, useRef } from "react";
import { ArrowLeft, PackageSearch, RotateCcw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { useProductDetail } from "@/features/inventory/hooks/useProductQueries";
import { getTypeInfo } from "@/features/movements/columns";
import { Route } from "@/routes/_app/inventory_.$productId";
import { formatCurrencyUSD, formatCurrencyVES, formatDateTime } from "@/utils/formatters";

function DetailSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:p-4 lg:grid-cols-4"
      role="status"
      aria-label="Cargando detalle del producto"
    >
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="border-border/60 bg-card flex min-h-24 flex-col gap-3 rounded-xl border p-4 shadow-sm"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
      ))}
    </div>
  );
}

type DetailItemProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

function DetailItem({ label, children, className }: DetailItemProps) {
  return (
    <div
      className={`border-border/60 bg-card flex min-h-24 flex-col gap-2 rounded-xl border p-4 shadow-sm ${className ?? ""}`}
    >
      <dt className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">{label}</dt>
      <dd className="text-foreground flex min-h-7 items-center text-base font-semibold">{children}</dd>
    </div>
  );
}

export function ProductDetailPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate({ from: "/inventory/$productId" });
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  const initialBusinessId = useRef(businessId);
  const productQuery = useProductDetail(productId);
  const exchangeRateQuery = useExchangeRate();

  useEffect(() => {
    if (initialBusinessId.current && businessId !== initialBusinessId.current) {
      navigate({ to: "/", replace: true });
    }
  }, [businessId, navigate]);

  useEffect(() => {
    if (!productQuery.isPending && !productQuery.isError && !productQuery.data) {
      navigate({ to: "/", replace: true });
    }
  }, [navigate, productQuery.data, productQuery.isError, productQuery.isPending]);

  const goBack = () => navigate({ to: "/inventory" });
  const isPending = productQuery.isPending || exchangeRateQuery.isPending;
  const isError = productQuery.isError || exchangeRateQuery.isError;

  return (
    <section className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="topbar-height bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <Button variant="ghost" size="icon-xs" aria-label="Volver al inventario" onClick={goBack}>
          <ArrowLeft aria-hidden="true" />
        </Button>
        <BusinessModuleTitle title="Detalle de producto" />
      </header>

      {isPending ? (
        <DetailSkeleton />
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex max-w-sm flex-col items-center gap-3 text-center">
            <div className="bg-destructive/10 flex size-11 items-center justify-center rounded-xl">
              <PackageSearch className="text-destructive size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-sm font-semibold">No pudimos cargar el producto</h2>
              <p className="text-muted-foreground text-xs">Verifica tu conexión e inténtalo nuevamente.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                void productQuery.refetch();
                void exchangeRateQuery.refetch();
              }}
            >
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          </div>
        </div>
      ) : productQuery.data ? (
        <dl className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:p-4 lg:grid-cols-4">
          <DetailItem label="Código">
            <span className="product-code font-bold uppercase">{productQuery.data.product.code}</span>
          </DetailItem>
          <DetailItem label="Descripción" className="lg:col-span-2">
            <span className="text-sm leading-relaxed font-medium whitespace-normal">
              {productQuery.data.product.description}
            </span>
          </DetailItem>
          <DetailItem label="Estado">
            <Badge variant={productQuery.data.product.active ? "success" : "secondary"}>
              {productQuery.data.product.active ? "Activo" : "Inactivo"}
            </Badge>
          </DetailItem>
          <DetailItem label="Stock">
            <span className="tabular-nums">{productQuery.data.product.stock}</span>
          </DetailItem>
          <DetailItem label="Precio USD">
            <span className="tabular-nums">{formatCurrencyUSD(productQuery.data.product.price_usd)}</span>
          </DetailItem>
          <DetailItem label="Precio VES">
            {exchangeRateQuery.data ? (
              <span className="tabular-nums">
                {formatCurrencyVES(productQuery.data.product.price_usd * exchangeRateQuery.data.rate)}
              </span>
            ) : (
              <span className="text-warning text-sm">Sin tasa</span>
            )}
          </DetailItem>
          <DetailItem label="Última actividad">
            {productQuery.data.lastActivity ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getTypeInfo(productQuery.data.lastActivity).variant}>
                  {getTypeInfo(productQuery.data.lastActivity).label}
                </Badge>
                <span className="text-muted-foreground text-xs font-normal tabular-nums">
                  {formatDateTime(productQuery.data.lastActivity.created_at) || "Fecha no disponible"}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-sm font-normal">Sin actividad registrada</span>
            )}
          </DetailItem>
        </dl>
      ) : (
        <DetailSkeleton />
      )}
    </section>
  );
}
