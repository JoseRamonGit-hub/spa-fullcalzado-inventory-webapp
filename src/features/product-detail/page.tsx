import { useEffect, useRef } from "react";
import { ArrowLeft, PackageSearch, RotateCcw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { useProductDetail } from "@/features/inventory/hooks/useProductQueries";
import { getMovementTypeInfo } from "@/features/movements/movement-presentation";
import { productHistoryColumns } from "./columns";
import { useProductHistory } from "./hooks/useProductHistory";
import { Route } from "@/routes/_app/inventory_.$productId";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES, formatDateTime } from "@/utils/formatters";

function getDetailItemClassName(index: number) {
  return cn(
    "border-border/50 flex min-w-0 flex-col gap-1 px-3",
    index % 2 === 0 ? "border-l-0 pl-0" : "border-l",
    index % 4 === 0 ? "sm:border-l-0 sm:pl-0" : "sm:border-l sm:pl-4",
    index === 0 ? "xl:border-l-0 xl:pl-0" : "xl:border-l xl:pl-4",
    index === 6 && "col-span-2 sm:col-span-2 xl:col-span-1 xl:pr-0",
  );
}

function DetailSkeleton() {
  return (
    <section className="shrink-0 border-b px-3 py-2.5 md:px-4" role="status" aria-label="Cargando detalle del producto">
      <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 xl:grid-cols-[0.9fr_2.6fr_0.9fr_1.1fr_1.3fr_0.9fr_minmax(17rem,2.3fr)]">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className={getDetailItemClassName(index)}>
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-24 max-w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

type DetailItemProps = {
  index: number;
  label: string;
  children: React.ReactNode;
};

function DetailItem({ index, label, children }: DetailItemProps) {
  return (
    <div className={getDetailItemClassName(index)}>
      <dt className="text-muted-foreground text-[10px] leading-tight font-semibold uppercase">{label}</dt>
      <dd className="text-foreground flex min-h-5 min-w-0 items-center text-sm leading-tight font-semibold">
        {children}
      </dd>
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
  const historyQuery = useProductHistory(productId);

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
        <>
          <section className="shrink-0 border-b px-3 py-2.5 md:px-4" aria-label="Resumen del producto">
            <dl className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 xl:grid-cols-[0.9fr_2.6fr_0.9fr_1.1fr_1.3fr_0.9fr_minmax(17rem,2.3fr)]">
              <DetailItem index={0} label="Código">
                <span className="product-code truncate font-bold uppercase">{productQuery.data.product.code}</span>
              </DetailItem>
              <DetailItem index={1} label="Descripción">
                <span className="truncate font-semibold" title={productQuery.data.product.description}>
                  {productQuery.data.product.description}
                </span>
              </DetailItem>
              <DetailItem index={2} label="Stock actual">
                <span
                  className={cn(
                    "tabular-nums",
                    productQuery.data.product.stock === 0
                      ? "text-destructive"
                      : productQuery.data.product.stock <= 3
                        ? "text-warning"
                        : "text-foreground",
                  )}
                >
                  {productQuery.data.product.stock}
                </span>
              </DetailItem>
              <DetailItem index={3} label="Precio USD">
                <span className="tabular-nums">{formatCurrencyUSD(productQuery.data.product.price_usd)}</span>
              </DetailItem>
              <DetailItem index={4} label="Precio VES">
                {exchangeRateQuery.data ? (
                  <span className="tabular-nums">
                    {formatCurrencyVES(productQuery.data.product.price_usd * exchangeRateQuery.data.rate)}
                  </span>
                ) : (
                  <span className="text-warning text-sm">Sin tasa</span>
                )}
              </DetailItem>
              <DetailItem index={5} label="Estado">
                <Badge variant={productQuery.data.product.active ? "success" : "secondary"}>
                  {productQuery.data.product.active ? "Activo" : "Inactivo"}
                </Badge>
              </DetailItem>
              <DetailItem index={6} label="Última actividad">
                {productQuery.data.lastActivity ? (
                  <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                    <Badge variant={getMovementTypeInfo(productQuery.data.lastActivity).variant}>
                      {getMovementTypeInfo(productQuery.data.lastActivity).label}
                    </Badge>
                    <span className="text-muted-foreground text-xs font-normal tabular-nums">
                      {formatDateTime(productQuery.data.lastActivity.created_at) || "Fecha no disponible"}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs font-normal">Sin actividad registrada</span>
                )}
              </DetailItem>
            </dl>
          </section>

          <section className="flex min-h-72 flex-1 flex-col" aria-labelledby="product-history-title">
            <div className="flex shrink-0 items-center justify-between px-3 py-3 md:px-4">
              <h2 id="product-history-title" className="text-muted-foreground text-[10px] font-semibold uppercase">
                Historial de producto
              </h2>
              <span className="text-muted-foreground text-xs">Últimos 30 días</span>
            </div>
            {historyQuery.isError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <div>
                  <p className="text-sm font-medium">No pudimos cargar el historial</p>
                  <p className="text-muted-foreground text-xs">Verifica tu conexión e inténtalo nuevamente.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Reintentar historial"
                  onClick={() => void historyQuery.refetch()}
                >
                  <RotateCcw aria-hidden="true" />
                  Reintentar
                </Button>
              </div>
            ) : (
              <DataTable
                columns={productHistoryColumns}
                data={historyQuery.data ?? []}
                isLoading={historyQuery.isPending}
                getRowId={(row) => row.id}
                emptyMessage="Sin movimientos."
                tableClassName="min-w-[760px]"
                scrollAreaLabel="Tabla de historial con desplazamiento horizontal"
              />
            )}
          </section>
        </>
      ) : (
        <DetailSkeleton />
      )}
    </section>
  );
}
