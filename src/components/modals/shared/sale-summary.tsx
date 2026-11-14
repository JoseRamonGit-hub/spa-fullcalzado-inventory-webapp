import { useId, type ReactNode } from "react";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD } from "@/utils/formatters";

export type SaleSummaryLine = {
  key: string;
  code: string;
  description: string;
  quantity: number;
  priceUsd: number;
  totalUsd: number;
};

type SaleLinesSectionProps = {
  lines: SaleSummaryLine[];
  title?: string;
};

export function SaleLinesSection({ lines, title = "Productos" }: SaleLinesSectionProps) {
  const headingId = useId();
  const lineCount = lines.length;

  return (
    <section aria-labelledby={headingId} className="bg-card overflow-hidden rounded-lg border">
      <header className="bg-muted/30 text-muted-foreground flex items-baseline justify-between gap-3 border-b px-3 py-1.5 text-xs">
        <h3 id={headingId} className="font-semibold">
          {title}
        </h3>
        <span>
          {lineCount} {lineCount === 1 ? "renglón" : "renglones"} de venta
        </span>
      </header>
      <ul className="custom-scrollbar divide-border/60 max-h-48 divide-y overflow-y-auto">
        {lines.map((line) => (
          <li key={line.key} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <OverflowTooltip className="text-sm leading-snug font-medium">{line.description}</OverflowTooltip>
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                <span className="product-code text-xs uppercase">{line.code}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-value">
                  {line.quantity} × {formatCurrencyUSD(line.priceUsd)}
                </span>
              </p>
            </div>
            <p className="data-value shrink-0 text-sm font-semibold whitespace-nowrap">
              {formatCurrencyUSD(line.totalUsd)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

type SaleTotalSectionProps = {
  totalUsd: number;
  totalVes: string;
  detail: ReactNode;
};

export function SaleTotalSection({ totalUsd, totalVes, detail }: SaleTotalSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="border-primary/20 bg-primary/5 flex items-center justify-between gap-4 rounded-lg border px-3 py-3"
    >
      <div className="min-w-0">
        <h3 id={headingId} className="text-sm font-semibold">
          Total de la venta
        </h3>
        {detail}
      </div>
      <div className="shrink-0 text-right">
        <p className="data-value text-2xl leading-none font-bold whitespace-nowrap">{formatCurrencyUSD(totalUsd)}</p>
        <p className="data-value text-muted-foreground mt-1 text-sm font-medium whitespace-nowrap">{totalVes}</p>
      </div>
    </section>
  );
}
