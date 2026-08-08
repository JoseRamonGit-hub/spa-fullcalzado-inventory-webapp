import { useState } from "react";
import { Boxes, CircleDollarSign, RefreshCw, TriangleAlert, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { DashboardMetricCard, DashboardMetricCardSkeleton } from "./components/dashboard-metric-card";
import { SalesPeriodSection } from "./components/sales-period-section";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import { DEFAULT_SALES_PERIOD, type DashboardSalesPeriodSelection } from "./sales-period";
import { formatCurrencyUSD, formatCurrencyVES, formatDateTime } from "@/utils/formatters";

const RATE_SOURCE_LABELS = {
  manual: "Manual",
  bcv: "BCV",
} as const;

export function DashboardPage() {
  const metricsQuery = useDashboardMetrics();
  const [salesPeriod, setSalesPeriod] = useState<DashboardSalesPeriodSelection>({
    preset: DEFAULT_SALES_PERIOD,
  });

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="topbar-height bg-background flex shrink-0 items-center justify-between gap-2 border-b px-3 md:px-4">
        <BusinessModuleTitle title="Dashboard" />
        <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
          Hoy · hora de Caracas
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              Pulso del negocio
            </p>
            <h2 className="font-heading text-lg font-semibold">Indicadores de hoy</h2>
          </div>

          {metricsQuery.isPending ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Cargando indicadores">
              {Array.from({ length: 4 }).map((_, index) => (
                <DashboardMetricCardSkeleton key={index} />
              ))}
            </div>
          ) : metricsQuery.isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center">
              <div className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-lg">
                <TriangleAlert className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">No se pudieron cargar los indicadores.</p>
                <p className="text-muted-foreground text-xs">Verifica la conexión e inténtalo de nuevo.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => metricsQuery.refetch()}>
                <RefreshCw data-icon="inline-start" />
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardMetricCard
                title="Total facturado"
                value={formatCurrencyUSD(metricsQuery.data.total_billed_usd)}
                description={`${metricsQuery.data.billed_operations} operaciones facturadas`}
                icon={CircleDollarSign}
                emphasis="primary"
              />
              <DashboardMetricCard
                title="Stock disponible"
                value={`${metricsQuery.data.stock_units} unidades`}
                description={`${metricsQuery.data.products_in_stock} productos con stock`}
                icon={Boxes}
              />
              <DashboardMetricCard
                title="Tasa activa"
                value={
                  metricsQuery.data.exchange_rate === null
                    ? "Sin tasa vigente"
                    : formatCurrencyVES(metricsQuery.data.exchange_rate)
                }
                description={
                  metricsQuery.data.exchange_rate_source && metricsQuery.data.exchange_rate_updated_at
                    ? `Fuente ${RATE_SOURCE_LABELS[metricsQuery.data.exchange_rate_source]} · ${formatDateTime(metricsQuery.data.exchange_rate_updated_at)}`
                    : "Configúrala en Ajustes para operar"
                }
                icon={WalletCards}
              />
              <DashboardMetricCard
                title="Stock bajo"
                value={String(metricsQuery.data.low_stock_products)}
                description="Productos activos con 3 unidades o menos"
                icon={TriangleAlert}
                emphasis={metricsQuery.data.low_stock_products > 0 ? "warning" : undefined}
              />
            </div>
          )}

          <SalesPeriodSection selection={salesPeriod} onSelectionChange={setSalesPeriod} />
        </div>
      </div>
    </section>
  );
}
