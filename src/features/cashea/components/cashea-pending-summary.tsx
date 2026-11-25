import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { useDashboardCasheaReceivable } from "@/features/dashboard/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatInteger } from "@/utils/formatters";
import { formatCasheaAgeDays, getCasheaOrderAgeDays } from "../cashea-receivables";

const MISSING_VALUE = "—";

/** Lo que Cashea debe hoy al negocio, sin importar la pestaña, la búsqueda ni el rango que se esté mirando. */
export function CasheaPendingSummary() {
  const { data, isPending, isError } = useDashboardCasheaReceivable();

  if (isPending) return <MetricsSkeleton count={4} />;

  const summary = isError ? null : data;
  const ageDays = summary?.oldest_sale_date ? getCasheaOrderAgeDays(summary.oldest_sale_date) : null;
  const metrics = [
    { label: "Saldo pendiente", value: summary ? formatCurrencyUSD(summary.financed_usd) : MISSING_VALUE },
    { label: "Neto esperado", value: summary ? formatCurrencyUSD(summary.expected_net_usd) : MISSING_VALUE },
    { label: "Órdenes pendientes", value: summary ? formatInteger(summary.orders_count) : MISSING_VALUE },
    { label: "La más antigua", value: ageDays == null ? MISSING_VALUE : formatCasheaAgeDays(ageDays) },
  ];

  return (
    <section
      aria-label="Saldo pendiente Cashea"
      className="grid shrink-0 grid-cols-2 border-b px-3 py-2.5 md:grid-cols-4 md:px-4"
    >
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={cn(
            "min-w-0 pr-3 md:pr-4",
            index < 2 ? "border-b pb-2 md:border-b-0 md:pb-0" : "pt-2 md:pt-0",
            index === 0 ? "pl-0" : index % 2 === 1 ? "border-l pl-3 md:pl-4" : "pl-0 md:border-l md:pl-4",
          )}
        >
          <p className="text-muted-foreground truncate text-[10px] font-semibold uppercase">{metric.label}</p>
          <p className="mt-1 truncate text-sm leading-tight font-semibold tabular-nums">{metric.value}</p>
        </div>
      ))}
    </section>
  );
}
