import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ArrowLeft, PackageSearch, RotateCcw } from "lucide-react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { useProductDetail } from "@/features/inventory/hooks/useProductQueries";
import { EditProductModal } from "@/features/inventory/components/edit-product-modal";
import { AdjustProductStockModal } from "@/features/inventory/components/adjust-product-stock-modal";
import { ToggleStatusModal } from "@/features/inventory/components/toggle-status-modal";
import { ProductMaintenanceActions } from "@/features/inventory/components/product-maintenance-actions";
import { formatProductStagnantDays } from "@/features/inventory/product-stagnation";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { getMovementTypeInfo } from "@/features/movements/movement-presentation";
import { productHistoryColumns } from "./columns";
import { ProductHistoryPeriodFilter } from "./components/product-history-period-filter";
import { useProductHistory } from "./hooks/useProductHistory";
import { getProductHistoryRange, type ProductHistoryPeriod } from "./product-history-filter";
import { Route } from "@/routes/_app/inventory_.$productId";
import { cn } from "@/lib/utils";
import { formatCalendarDateForBackend, formatCurrencyUSD, formatCurrencyVES, formatDateTime } from "@/utils/formatters";

const summaryGridClassName =
  "grid gap-y-3 sm:grid-cols-2 sm:gap-y-4 xl:grid-cols-[minmax(16rem,1.15fr)_minmax(13rem,0.9fr)_minmax(20rem,1.45fr)] xl:gap-y-0";

const inventoryGroupClassName = "grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(4rem,0.7fr)_minmax(5.5rem,1fr)] gap-x-3";

const priceGroupClassName =
  "border-border/50 grid min-w-0 grid-cols-2 gap-x-3 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4";

const lifecycleGroupClassName =
  "border-border/50 grid min-w-0 grid-cols-[minmax(4.5rem,0.6fr)_minmax(0,1.4fr)] gap-x-3 border-t pt-3 sm:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-4";

function SummarySkeletonItem({ emphasized = false }: { emphasized?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Skeleton className="h-2.5 w-16 max-w-full" />
      <Skeleton className={cn(emphasized ? "h-[18px] w-10" : "h-4 w-24", "max-w-full")} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <section className="shrink-0 border-b px-3 py-3 md:px-4" role="status" aria-label="Cargando detalle del producto">
      <div className={summaryGridClassName}>
        <div className={inventoryGroupClassName}>
          <SummarySkeletonItem />
          <SummarySkeletonItem emphasized />
          <SummarySkeletonItem />
        </div>
        <div className={priceGroupClassName}>
          <SummarySkeletonItem />
          <SummarySkeletonItem />
        </div>
        <div className={lifecycleGroupClassName}>
          <SummarySkeletonItem />
          <SummarySkeletonItem />
        </div>
      </div>
    </section>
  );
}

type DetailItemProps = {
  label: string;
  children: React.ReactNode;
  valueClassName?: string;
};

function DetailItem({ label, children, valueClassName }: DetailItemProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground text-[10px] leading-tight font-semibold uppercase">{label}</dt>
      <dd
        className={cn(
          "text-foreground flex min-h-5 min-w-0 items-center text-sm leading-tight font-semibold",
          valueClassName,
        )}
      >
        {children}
      </dd>
    </div>
  );
}

export function ProductDetailPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate({ from: "/inventory/$productId" });
  const router = useRouter();
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  const initialBusinessId = useRef(businessId);
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [historyPeriod, setHistoryPeriod] = useState<ProductHistoryPeriod>("last-30-days");
  const [customHistoryRange, setCustomHistoryRange] = useState<DateRange>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false);
  const productQuery = useProductDetail(productId);
  const exchangeRateQuery = useExchangeRate();
  const customRange = customHistoryRange?.from
    ? {
        startDate: formatCalendarDateForBackend(customHistoryRange.from),
        endDate: customHistoryRange.to ? formatCalendarDateForBackend(customHistoryRange.to) : undefined,
      }
    : undefined;
  const historyRange = getProductHistoryRange(historyPeriod, customRange);
  const historyQuery = useProductHistory(productId, historyRange);

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

  const goBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    navigate({ to: "/inventory" });
  };
  const isPending = productQuery.isPending || exchangeRateQuery.isPending;
  const isError = productQuery.isError || exchangeRateQuery.isError;

  return (
    <section className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="topbar-height bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <Button variant="ghost" size="icon" aria-label="Volver a la pantalla anterior" onClick={goBack}>
          <ArrowLeft aria-hidden="true" />
        </Button>
        <BusinessModuleTitle
          title={productQuery.data ? productQuery.data.product.description : "Detalle del producto"}
          className="min-w-0 flex-1 shrink"
          titleClassName="truncate"
        />
        {isAdmin && productQuery.data ? (
          <ProductMaintenanceActions
            product={productQuery.data.product}
            onEdit={() => setIsEditOpen(true)}
            onAdjustStock={() => setIsAdjustStockOpen(true)}
            onToggleStatus={() => setIsToggleStatusOpen(true)}
            presentation="toolbar"
          />
        ) : null}
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
              <h2 className="font-heading text-sm font-semibold">No pudimos cargar el detalle del producto</h2>
              <p className="text-muted-foreground text-xs">
                No fue posible consultar los datos necesarios. Inténtalo nuevamente.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                void productQuery.refetch();
                void exchangeRateQuery.refetch();
              }}
            >
              <RotateCcw aria-hidden="true" />
              Reintentar carga
            </Button>
          </div>
        </div>
      ) : productQuery.data ? (
        <>
          <section className="shrink-0 border-b px-3 py-3 md:px-4" aria-label="Resumen del producto">
            <div className={summaryGridClassName}>
              <dl className={inventoryGroupClassName} aria-label="Inventario">
                <DetailItem label="Código">
                  <span className="product-code truncate font-bold uppercase">{productQuery.data.product.code}</span>
                </DetailItem>
                <DetailItem
                  label="Stock actual"
                  valueClassName="font-heading text-lg leading-none font-bold tabular-nums"
                >
                  <span
                    className={cn(
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
                <DetailItem label="Sin salida comercial">
                  <span className="whitespace-nowrap tabular-nums">
                    {formatProductStagnantDays(productQuery.data.stagnantDays)}
                  </span>
                </DetailItem>
              </dl>

              <dl className={priceGroupClassName} aria-label="Precios">
                <DetailItem label="Precio USD">
                  <span className="whitespace-nowrap tabular-nums">
                    {formatCurrencyUSD(productQuery.data.product.price_usd)}
                  </span>
                </DetailItem>
                <DetailItem label="Precio VES">
                  {exchangeRateQuery.data ? (
                    <span className="whitespace-nowrap tabular-nums">
                      {formatCurrencyVES(productQuery.data.product.price_usd * exchangeRateQuery.data.rate)}
                    </span>
                  ) : (
                    <span className="text-warning text-sm whitespace-nowrap">Tasa no disponible</span>
                  )}
                </DetailItem>
              </dl>

              <dl className={lifecycleGroupClassName} aria-label="Estado y actividad">
                <DetailItem label="Estado">
                  <Badge variant={productQuery.data.product.active ? "success" : "secondary"}>
                    {productQuery.data.product.active ? "Activo" : "Inactivo"}
                  </Badge>
                </DetailItem>
                <DetailItem label="Última actividad">
                  {productQuery.data.lastActivity ? (
                    <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
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
            </div>
          </section>

          <section className="flex min-h-72 flex-1 flex-col" aria-labelledby="product-history-title">
            <div className="flex shrink-0 flex-col items-start gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between md:px-4">
              <h2 id="product-history-title" className="font-heading text-foreground/75 text-xs font-semibold">
                Historial de producto
              </h2>
              <ProductHistoryPeriodFilter
                period={historyPeriod}
                customRange={customHistoryRange}
                onPeriodChange={setHistoryPeriod}
                onCustomRangeChange={setCustomHistoryRange}
              />
            </div>
            {!historyRange ? (
              <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-center text-sm">
                Selecciona una fecha inicial y una fecha final. Ninguna puede ser futura.
              </div>
            ) : historyQuery.isError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <div>
                  <p className="text-sm font-medium">No pudimos cargar el historial del producto</p>
                  <p className="text-muted-foreground text-xs">
                    El resumen sigue disponible. Intenta cargar el historial nuevamente.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Reintentar historial"
                  onClick={() => void historyQuery.refetch()}
                >
                  <RotateCcw aria-hidden="true" />
                  Reintentar historial
                </Button>
              </div>
            ) : (
              <DataTable
                key={`${historyPeriod}-${historyRange.startDate ?? ""}-${historyRange.endDate ?? ""}-${historyRange.showAll}`}
                columns={productHistoryColumns}
                data={historyQuery.data ?? []}
                isLoading={historyQuery.isPending}
                getRowId={(row) => row.id}
                emptyMessage={
                  historyPeriod === "all"
                    ? "Este producto aún no tiene movimientos registrados."
                    : "No hay movimientos en el período seleccionado."
                }
                tableClassName="min-w-[520px] sm:min-w-[640px] [&_tbody_td]:h-auto [&_tbody_td]:py-1 sm:[&_tbody_td]:h-[30px] sm:[&_tbody_td]:py-0"
                scrollAreaLabel="Tabla de historial con desplazamiento horizontal"
              />
            )}
          </section>
        </>
      ) : (
        <DetailSkeleton />
      )}

      {productQuery.data && isEditOpen ? (
        <EditProductModal open={isEditOpen} onOpenChange={setIsEditOpen} product={productQuery.data.product} />
      ) : null}

      {productQuery.data && isToggleStatusOpen ? (
        <ToggleStatusModal
          open={isToggleStatusOpen}
          onOpenChange={setIsToggleStatusOpen}
          product={productQuery.data.product}
        />
      ) : null}

      {productQuery.data && isAdjustStockOpen ? (
        <AdjustProductStockModal
          open={isAdjustStockOpen}
          onOpenChange={setIsAdjustStockOpen}
          product={productQuery.data.product}
        />
      ) : null}
    </section>
  );
}
