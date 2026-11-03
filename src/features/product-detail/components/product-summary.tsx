import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types";
import {
  formatCalendarDateString,
  formatCurrencyUSD,
  formatCurrencyVES,
  formatDateTime,
  formatTime,
} from "@/utils/formatters";
import {
  formatRelativeDays,
  getCalendarDaysSince,
  getStockLevel,
  type StockLevel,
  type StockPoint,
} from "../product-detail-presentation";
import { ProductStockChart } from "./product-stock-chart";

const metricsGridClassName =
  "grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-[minmax(7rem,auto)_minmax(9rem,auto)_minmax(10rem,auto)_minmax(14rem,1fr)] md:gap-0";

const metricClassName = "flex min-w-0 flex-col gap-1 md:border-l md:px-6 md:first:border-l-0 md:first:pl-0";

const stockLevelPresentation: Record<StockLevel, { hint: string; valueClassName: string; hintClassName: string }> = {
  out: { hint: "Agotado", valueClassName: "text-destructive", hintClassName: "text-destructive" },
  low: { hint: "Stock bajo", valueClassName: "text-warning", hintClassName: "text-warning" },
  ok: { hint: "En existencia", valueClassName: "text-foreground", hintClassName: "text-muted-foreground" },
};

type MetricProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  valueClassName?: string;
};

function Metric({ label, value, hint, valueClassName }: MetricProps) {
  return (
    <div className={metricClassName}>
      <dt className="operational-label text-muted-foreground">{label}</dt>
      <dd className={cn("font-heading text-foreground text-xl leading-tight font-bold tracking-tight", valueClassName)}>
        {value}
      </dd>
      {hint ? <dd className="text-muted-foreground min-h-4 text-xs">{hint}</dd> : null}
    </div>
  );
}

type ProductSummaryProps = {
  detail: ProductDetail;
  exchangeRate: ReturnType<typeof useExchangeRate>;
  stockPoints: StockPoint[];
  isHistoryLoading: boolean;
  periodLabel: string;
  actions: React.ReactNode;
};

export function ProductSummary({
  detail,
  exchangeRate,
  stockPoints,
  isHistoryLoading,
  periodLabel,
  actions,
}: ProductSummaryProps) {
  const { product, lastSale, stagnantSince } = detail;
  const stockLevel = stockLevelPresentation[getStockLevel(product.stock)];
  const daysSinceSale = lastSale ? getCalendarDaysSince(lastSale.created_at) : null;

  return (
    <section className="border-b px-4 pt-4 pb-5 md:px-6" aria-label="Resumen del producto">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-heading text-foreground text-lg leading-snug font-semibold tracking-tight text-balance">
            {product.description}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="product-code uppercase">{product.code}</span>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            {product.active ? (
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <span className="bg-success size-1.5 rounded-full" aria-hidden="true" />
                Activo
              </span>
            ) : (
              <Badge variant="destructive">Inactivo</Badge>
            )}
          </div>
        </div>
        {actions}
      </div>

      <dl className={cn(metricsGridClassName, "mt-5")}>
        <Metric
          label="Stock"
          value={<span className="tabular-value">{product.stock}</span>}
          valueClassName={stockLevel.valueClassName}
          hint={<span className={stockLevel.hintClassName}>{stockLevel.hint}</span>}
        />

        <Metric
          label="Precio"
          value={<span className="tabular-value">{formatCurrencyUSD(product.price_usd)}</span>}
          hint={
            exchangeRate.data ? (
              <span className="tabular-value">{formatCurrencyVES(product.price_usd * exchangeRate.data.rate)}</span>
            ) : exchangeRate.isPending ? (
              "Consultando tasa…"
            ) : exchangeRate.isError ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-warning hover:text-warning h-auto px-0 text-xs"
                disabled={exchangeRate.isFetching}
                onClick={() => void exchangeRate.refetch()}
              >
                <RotateCcw className={exchangeRate.isFetching ? "animate-spin" : undefined} aria-hidden="true" />
                {exchangeRate.isFetching ? "Reintentando…" : "Reintentar tasa"}
              </Button>
            ) : (
              <span className="text-warning">Tasa no disponible</span>
            )
          }
        />

        <Metric
          label="Última venta"
          value={lastSale && daysSinceSale !== null ? formatRelativeDays(daysSinceSale) : "Sin ventas"}
          valueClassName={lastSale ? undefined : "text-muted-foreground"}
          hint={
            lastSale
              ? daysSinceSale === 0
                ? formatTime(lastSale.created_at)
                : formatDateTime(lastSale.created_at)
              : stagnantSince
                ? `En stock desde ${formatCalendarDateString(stagnantSince)}`
                : "Sin movimientos registrados"
          }
        />

        <div className={cn(metricClassName, "col-span-2 md:col-span-1")}>
          <dt className="operational-label text-muted-foreground flex items-baseline justify-between gap-2">
            Evolución del stock
            <span className="text-muted-foreground/80 font-normal tracking-normal normal-case">{periodLabel}</span>
          </dt>
          <dd>
            <ProductStockChart points={stockPoints} isLoading={isHistoryLoading} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function ProductSummarySkeleton() {
  return (
    <section className="border-b px-4 pt-4 pb-5 md:px-6" role="status" aria-label="Cargando detalle del producto">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className={cn(metricsGridClassName, "mt-5")}>
        {[0, 1, 2].map((index) => (
          <div key={index} className={metricClassName}>
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
        <div className={cn(metricClassName, "col-span-2 md:col-span-1")}>
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </section>
  );
}
