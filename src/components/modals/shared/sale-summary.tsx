import { useId, type ReactNode } from "react";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

export type SaleSummaryLine = {
  key: string;
  code: string;
  description: string;
  quantity: number;
  priceUsd: number;
  totalUsd: number;
};

type SaleSummaryCardProps = {
  title: string;
  lines: SaleSummaryLine[];
  totalUsd: number;
  totalVes: number | null;
  exchangeRate: string | null;
  notice?: ReactNode;
};

const MAX_VISIBLE_LINES = 5;

export function SaleSummaryCard({ title, lines, totalUsd, totalVes, exchangeRate, notice }: SaleSummaryCardProps) {
  const headingId = useId();
  const lineCount = lines.length;
  const isSingleLine = lineCount === 1;
  const isScrollable = lineCount > MAX_VISIBLE_LINES;

  return (
    <section aria-labelledby={headingId} className="bg-card overflow-hidden rounded-lg border">
      <header className="flex items-baseline justify-between gap-3 border-b px-3 py-2">
        <h3 id={headingId} className="text-sm font-semibold">
          {title}
        </h3>
        <span className="text-muted-foreground text-xs">
          {lineCount} {isSingleLine ? "renglón" : "renglones"}
        </span>
      </header>

      <ul
        className={cn(
          "divide-border/60 divide-y",
          isScrollable && "custom-scrollbar max-h-70 [scrollbar-gutter:stable] overflow-y-auto",
        )}
      >
        {lines.map((line) => (
          <li key={line.key} className="flex h-14 items-center justify-between gap-3 px-3">
            <div className="min-w-0 flex-1">
              <OverflowTooltip className="text-sm leading-snug font-medium">{line.description}</OverflowTooltip>
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                <span className="product-code text-xs uppercase">{line.code}</span>
                {line.quantity > 1 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-value">
                      {line.quantity} × {formatCurrencyUSD(line.priceUsd)}
                    </span>
                  </>
                )}
              </p>
            </div>
            {!isSingleLine && (
              <p className="data-value shrink-0 text-sm font-semibold whitespace-nowrap">
                {formatCurrencyUSD(line.totalUsd)}
              </p>
            )}
          </li>
        ))}
      </ul>

      <footer className={cn("bg-muted/30 border-t py-2.5 pl-3", isScrollable ? "pr-[calc(0.75rem+6px)]" : "pr-3")}>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-semibold">Total</p>
          <p className="data-value text-xl leading-none font-bold whitespace-nowrap">{formatCurrencyUSD(totalUsd)}</p>
        </div>
        <p className="data-value text-muted-foreground mt-1 text-right text-xs whitespace-nowrap">
          {totalVes === null ? "— Bs." : formatCurrencyVES(totalVes)}
          {exchangeRate && (
            <>
              <span aria-hidden="true"> · </span>
              Tasa <span className="text-foreground font-medium">{exchangeRate}</span>
            </>
          )}
        </p>
        {notice}
      </footer>
    </section>
  );
}
