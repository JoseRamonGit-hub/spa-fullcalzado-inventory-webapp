import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ArrowLeft, PackageSearch, RotateCcw } from "lucide-react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { useProductDetail } from "@/features/inventory/hooks/useProductQueries";
import { EditProductModal } from "@/features/inventory/components/edit-product-modal";
import { AdjustProductStockModal } from "@/features/inventory/components/adjust-product-stock-modal";
import { ToggleStatusModal } from "@/features/inventory/components/toggle-status-modal";
import { MobileActionDrawer } from "@/features/inventory/components/mobile-action-drawer";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { productHistoryColumns } from "./columns";
import { ProductDetailActions } from "./components/product-detail-actions";
import { ProductHistoryPeriodFilter } from "./components/product-history-period-filter";
import { ProductSummary, ProductSummarySkeleton } from "./components/product-summary";
import { useProductHistory } from "./hooks/useProductHistory";
import { buildStockSeries } from "./product-detail-presentation";
import {
  getProductHistoryRange,
  productHistoryPeriodLabels,
  type ProductHistoryPeriod,
} from "./product-history-filter";
import { Route } from "@/routes/_app/inventory_.$productId";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCalendarDateForBackend } from "@/utils/formatters";

export function ProductDetailPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate({ from: "/inventory/$productId" });
  const router = useRouter();
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  const initialBusinessId = useRef(businessId);
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const isMobile = useIsMobile();
  const [historyPeriod, setHistoryPeriod] = useState<ProductHistoryPeriod>("last-30-days");
  const [customHistoryRange, setCustomHistoryRange] = useState<DateRange>();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
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
  const isPending = productQuery.isPending && !productQuery.data;
  const isBlockingError = productQuery.isError && !productQuery.data;
  const historyCount = historyRange && historyQuery.data ? historyQuery.data.length : null;
  const historyToolbar = (
    <div className="flex shrink-0 flex-col items-start gap-2 px-4 pt-5 pb-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className="flex items-baseline gap-2">
        <h2 id="product-history-title" className="font-heading text-foreground text-base font-semibold tracking-tight">
          Historial de movimientos
        </h2>
        {historyCount !== null ? (
          <span className="text-muted-foreground tabular-value text-xs">
            {historyCount} {historyCount === 1 ? "movimiento" : "movimientos"}
          </span>
        ) : null}
      </div>
      <ProductHistoryPeriodFilter
        period={historyPeriod}
        customRange={customHistoryRange}
        onPeriodChange={setHistoryPeriod}
        onCustomRangeChange={setCustomHistoryRange}
      />
    </div>
  );
  const productSummary = productQuery.data ? (
    <ProductSummary
      detail={productQuery.data}
      exchangeRate={exchangeRateQuery}
      stockPoints={buildStockSeries(historyRange ? (historyQuery.data ?? []) : [], productQuery.data.product.stock)}
      isHistoryLoading={!!historyRange && historyQuery.isPending}
      periodLabel={productHistoryPeriodLabels[historyPeriod]}
      actions={
        isAdmin ? (
          <ProductDetailActions
            product={productQuery.data.product}
            isMobile={isMobile}
            onEdit={() => setIsEditOpen(true)}
            onAdjustStock={() => setIsAdjustStockOpen(true)}
            onToggleStatus={() => setIsToggleStatusOpen(true)}
            onOpenMobileActions={() => setIsMobileActionsOpen(true)}
          />
        ) : null
      }
    />
  ) : null;

  return (
    <section className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="topbar-height bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <Button variant="ghost" size="icon" aria-label="Volver a la pantalla anterior" onClick={goBack}>
          <ArrowLeft aria-hidden="true" />
        </Button>
        <BusinessModuleTitle title="Detalle del producto" className="min-w-0 flex-1 shrink" titleClassName="truncate" />
      </header>

      {isPending ? (
        <ProductSummarySkeleton />
      ) : isBlockingError ? (
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
        <section className="flex min-h-72 flex-1 flex-col" aria-labelledby="product-history-title">
          {!historyRange ? (
            <>
              {productSummary}
              {historyToolbar}
              <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center p-6 text-center text-sm">
                Selecciona una fecha inicial y una fecha final. Ninguna puede ser futura.
              </div>
            </>
          ) : historyQuery.isError && !historyQuery.data ? (
            <>
              {productSummary}
              {historyToolbar}
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
            </>
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
              scrollAreaHeader={
                <>
                  {productSummary}
                  {historyToolbar}
                </>
              }
              tableClassName="min-w-[720px]"
              scrollAreaLabel="Historial del producto"
            />
          )}
        </section>
      ) : (
        <ProductSummarySkeleton />
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

      {productQuery.data ? (
        <MobileActionDrawer
          product={isMobileActionsOpen ? productQuery.data.product : null}
          isAdmin={isAdmin}
          onClose={() => setIsMobileActionsOpen(false)}
          onEdit={() => {
            setIsMobileActionsOpen(false);
            setIsEditOpen(true);
          }}
          onAdjustStock={() => {
            setIsMobileActionsOpen(false);
            setIsAdjustStockOpen(true);
          }}
          onToggleStatus={() => {
            setIsMobileActionsOpen(false);
            setIsToggleStatusOpen(true);
          }}
          showViewDetail={false}
        />
      ) : null}
    </section>
  );
}
