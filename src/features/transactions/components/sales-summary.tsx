import { Banknote, DollarSign, ShoppingCart } from "lucide-react";
import type { ReturnWithRelations, TransactionWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { getSalesSummary } from "../sales-display";

type SalesSummaryProps = {
  transactions: readonly TransactionWithRelations[];
  returns: readonly ReturnWithRelations[];
};

export function SalesSummary({ transactions, returns }: SalesSummaryProps) {
  const summary = getSalesSummary(transactions, returns);
  const metrics = [
    { label: "Ventas", value: String(summary.salesCount), icon: ShoppingCart },
    { label: "Total producido USD", value: formatCurrencyUSD(summary.netUsd), icon: DollarSign },
    { label: "Total producido Bs.", value: formatCurrencyVES(summary.netVes), icon: Banknote },
  ];

  return (
    <section className="shrink-0 border-b px-3 py-2.5 md:px-4" aria-label="Ventas de hoy">
      <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase">Ventas de hoy</p>
      <div className="grid grid-cols-3">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              "min-w-0 px-3",
              index > 0 && "border-l",
              index === 0 && "pl-0",
              index === metrics.length - 1 && "pr-0",
            )}
          >
            <div className="text-muted-foreground flex min-h-7 items-start gap-1.5">
              <metric.icon className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <p className="text-[10px] leading-tight font-semibold uppercase">{metric.label}</p>
            </div>
            <p className="mt-0.5 text-sm leading-tight font-semibold tabular-nums">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
