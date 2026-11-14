import type { CasheaOrder } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatInteger } from "@/utils/formatters";
import { getCasheaPendingSummary } from "../cashea-receivables";

type CasheaPendingSummaryProps = {
  orders: readonly CasheaOrder[];
};

export function CasheaPendingSummary({ orders }: CasheaPendingSummaryProps) {
  const summary = getCasheaPendingSummary(orders);
  const label = "Pendientes de la lista";
  const metrics = [
    { label: "Órdenes pendientes", value: formatInteger(summary.count) },
    { label: "Saldo pendiente", value: formatCurrencyUSD(summary.financedUsd) },
    { label: "Neto esperado", value: formatCurrencyUSD(summary.expectedNetUsd) },
  ];

  return (
    <section className="shrink-0 border-b px-3 py-2.5 md:px-4" aria-label={label}>
      <p className="text-muted-foreground mb-2 hidden text-[10px] font-semibold uppercase md:block">{label}</p>
      <div className="grid grid-cols-3">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={cn("min-w-0 px-3", index === 0 ? "pl-0" : "border-l md:pl-4")}>
            <p className="text-muted-foreground truncate text-[10px] font-semibold uppercase">{metric.label}</p>
            <p className="mt-1 text-sm leading-tight font-semibold tabular-nums">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
