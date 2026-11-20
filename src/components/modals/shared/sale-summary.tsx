import { useId, type ReactNode } from "react";
import { ModalProductIdentity } from "./modal-ui";
import { ConfirmationAmounts } from "./confirmation-amounts";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD } from "@/utils/formatters";

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
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  const isScrollable = lineCount > MAX_VISIBLE_LINES;

  return (
    <section aria-labelledby={headingId} className="grid min-w-0 gap-3">
      <div className="bg-card overflow-hidden rounded-md border">
        <header className="bg-muted/70 flex items-baseline justify-between gap-3 border-b px-3 py-2">
          <h3 id={headingId} className="operational-label text-muted-foreground">
            {title}
          </h3>
          <span className="text-muted-foreground text-xs">
            {units} {units === 1 ? "unidad" : "unidades"}
          </span>
        </header>

        <ul
          className={cn(
            "divide-border/60 divide-y",
            isScrollable && "custom-scrollbar max-h-70 [scrollbar-gutter:stable] overflow-y-auto",
          )}
        >
          {lines.map((line) => (
            <li key={line.key} className="flex items-baseline justify-between gap-3 px-3 py-1.5 text-xs">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <ModalProductIdentity code={line.code} description={line.description} />
                {line.quantity > 1 && (
                  <span className="text-muted-foreground tabular-value">
                    {line.quantity} × {formatCurrencyUSD(line.priceUsd)}
                  </span>
                )}
              </div>
              <span className="data-value shrink-0">{formatCurrencyUSD(line.totalUsd)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ConfirmationAmounts total={{ label: "Total de la venta", usd: totalUsd, ves: totalVes }} rate={exchangeRate} />
      {notice}
    </section>
  );
}
