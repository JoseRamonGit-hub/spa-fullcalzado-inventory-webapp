import type { ReturnWithRelations } from "@/types";
import { CurrencyStack } from "@/components/ui/currency-stack";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatters";
import { getReturnsSummary } from "../return-display";

type ReturnsSummaryProps = {
  date?: string;
  returns: readonly ReturnWithRelations[];
};

export function ReturnsSummary({ date, returns }: ReturnsSummaryProps) {
  const summary = getReturnsSummary(returns);
  const label = date ? `Resumen del ${formatDate(`${date}T12:00:00`)}` : "Resumen de los últimos 30 días";
  const metrics: ReadonlyArray<{ label: string; value: string; tone?: "refund" | "exchange" }> = [
    { label: "Operaciones", value: String(summary.operations) },
    { label: "Entradas", value: `${summary.entries} ${summary.entries === 1 ? "unidad" : "unidades"}`, tone: "refund" },
    { label: "Salidas", value: `${summary.exits} ${summary.exits === 1 ? "unidad" : "unidades"}`, tone: "exchange" },
  ];

  return (
    <section className="shrink-0 border-b px-3 py-2.5 md:px-4" aria-label={label}>
      <p className="text-muted-foreground mb-2 hidden text-[10px] font-semibold uppercase md:block">{label}</p>
      <div className="grid grid-cols-2 md:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              "min-w-0 px-3",
              index % 2 === 1 && "border-l",
              index > 1 && "mt-2 border-t pt-2",
              index === 0 || index === 2 ? "pl-0" : "",
              "md:mt-0 md:border-t-0 md:pt-0",
              index > 0 && "md:border-l md:pl-4",
            )}
          >
            <p className="text-muted-foreground text-[10px] font-semibold uppercase">{metric.label}</p>
            <p
              className={cn(
                "mt-1 text-sm leading-tight font-semibold tabular-nums",
                metric.tone === "refund" && "text-refund",
                metric.tone === "exchange" && "text-exchange",
              )}
            >
              {metric.value}
            </p>
          </div>
        ))}

        <div className="mt-2 min-w-0 border-t border-l px-3 pt-2 pr-0 md:mt-0 md:border-t-0 md:pt-0 md:pl-4">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase">Crédito generado</p>
          <CurrencyStack usd={summary.creditUsd} ves={summary.creditVes} />
        </div>
      </div>
    </section>
  );
}
