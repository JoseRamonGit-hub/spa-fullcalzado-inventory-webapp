import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Boxes, CircleDollarSign, ReceiptText, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { DashboardMetricCard, DashboardMetricCardSkeleton } from "./components/dashboard-metric-card";
import { SalesPeriodSection } from "./components/sales-period-section";
import { ProductStockAlertsSection } from "./components/product-stock-alerts-section";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import { DEFAULT_SALES_PERIOD, type DashboardSalesPeriodSelection } from "./sales-period";
import { formatCurrencyUSD, formatDate, formatInteger, formatTime } from "@/utils/formatters";

function DashboardCurrentDateTime() {
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentDateTime(new Date()), 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <time
      dateTime={currentDateTime.toISOString()}
      className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
      aria-label="Fecha y hora actual en Caracas"
    >
      {formatDate(currentDateTime)} · {formatTime(currentDateTime)}
    </time>
  );
}

function formatUnitsSold(unitsSold: number) {
  return `${unitsSold} ${unitsSold === 1 ? "unidad vendida" : "unidades vendidas"}`;
}

export function DashboardPage() {
  const navigate = useNavigate({ from: "/dashboard" });
  const metricsQuery = useDashboardMetrics();
  const [salesPeriod, setSalesPeriod] = useState<DashboardSalesPeriodSelection>({
    preset: DEFAULT_SALES_PERIOD,
  });

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="topbar-height bg-background flex shrink-0 items-center justify-between gap-2 border-b px-3 md:px-4">
        <BusinessModuleTitle title="Dashboard" />
        <DashboardCurrentDateTime />
      </header>

      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <h2 className="font-heading text-base font-semibold">Indicadores de hoy</h2>

          {metricsQuery.isPending ? (
            <div
              className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4"
              aria-label="Cargando indicadores"
            >
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
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
              <DashboardMetricCard
                title="Total producido"
                value={formatCurrencyUSD(metricsQuery.data.total_produced_usd)}
                description={`Total facturado ${formatCurrencyUSD(metricsQuery.data.total_billed_usd)} · ${metricsQuery.data.returns_credit_usd > 0 ? `−${formatCurrencyUSD(metricsQuery.data.returns_credit_usd)} en devoluciones` : "Sin devoluciones"}`}
                icon={CircleDollarSign}
                emphasis="primary"
              />
              <DashboardMetricCard
                title="Operaciones facturadas"
                value={String(metricsQuery.data.billed_operations)}
                description={formatUnitsSold(metricsQuery.data.units_sold)}
                icon={ReceiptText}
              />
              <DashboardMetricCard
                title="Stock disponible"
                value={`${formatInteger(metricsQuery.data.stock_units)} unidades`}
                description={`${metricsQuery.data.products_in_stock} productos con stock`}
                icon={Boxes}
              />
              <DashboardMetricCard
                title="Stock bajo"
                value={String(metricsQuery.data.low_stock_products)}
                description="Productos activos con 3 unidades o menos"
                icon={TriangleAlert}
                emphasis={metricsQuery.data.low_stock_products > 0 ? "warning" : undefined}
                actionLabel={metricsQuery.data.low_stock_products > 0 ? "Revisar stock bajo" : undefined}
                onAction={() => navigate({ to: "/inventory", search: { status: "low_stock" } })}
              />
            </div>
          )}

          <ProductStockAlertsSection />
          <SalesPeriodSection selection={salesPeriod} onSelectionChange={setSalesPeriod} />
        </div>
      </div>
    </section>
  );
}
