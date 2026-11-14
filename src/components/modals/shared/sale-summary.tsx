import type { ReactNode } from "react";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

export type SaleSummaryLine = {
  code: string;
  description: string;
  quantity: number;
  priceUsd: number;
};

type SaleSummaryProps = {
  lines: SaleSummaryLine[];
  totalUsd: number;
  totalVes: number | null;
  exchangeRate: string | null;
  notice?: ReactNode;
};

type SaleSummaryItem = SaleSummaryLine & { key: string; totalUsd: number };

function groupByProductAndPrice(lines: SaleSummaryLine[]): SaleSummaryItem[] {
  const items = new Map<string, SaleSummaryItem>();
  for (const line of lines) {
    const key = `${line.code}:${line.priceUsd}`;
    const item = items.get(key);
    if (item) {
      item.quantity += line.quantity;
      item.totalUsd += line.priceUsd * line.quantity;
    } else {
      items.set(key, { ...line, key, totalUsd: line.priceUsd * line.quantity });
    }
  }
  return [...items.values()];
}

export function SaleSummary({ lines, totalUsd, totalVes, exchangeRate, notice }: SaleSummaryProps) {
  const items = groupByProductAndPrice(lines);
  const isSingleItem = items.length === 1;

  return (
    <section aria-label="Productos de la venta" className="text-sm">
      <ul className="divide-border/60 divide-y">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-2">
            <span className="product-code shrink-0 text-xs uppercase">{item.code}</span>
            <OverflowTooltip className="min-w-0 flex-1">{item.description}</OverflowTooltip>
            {item.quantity > 1 && (
              <span className="tabular-value text-muted-foreground shrink-0 text-xs">× {item.quantity}</span>
            )}
            <span
              className={cn(
                "data-value shrink-0 whitespace-nowrap",
                isSingleItem ? "text-base font-semibold" : "font-medium",
              )}
            >
              {formatCurrencyUSD(item.totalUsd)}
            </span>
          </li>
        ))}
      </ul>

      <div className={cn(!isSingleItem && "border-t pt-2")}>
        {!isSingleItem && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">Total</span>
            <span className="data-value text-base font-semibold whitespace-nowrap">{formatCurrencyUSD(totalUsd)}</span>
          </div>
        )}
        <p className="text-muted-foreground mt-0.5 text-right text-xs whitespace-nowrap">
          <span className="data-value">{totalVes === null ? "— Bs." : formatCurrencyVES(totalVes)}</span>
          {exchangeRate && (
            <>
              <span aria-hidden="true"> · </span>
              Tasa <span className="data-value text-foreground font-medium">{exchangeRate}</span>
            </>
          )}
        </p>
        {notice}
      </div>
    </section>
  );
}
