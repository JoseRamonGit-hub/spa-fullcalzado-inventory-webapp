import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

interface SalesSummaryBlockProps {
  currentExchangeRate: number;
  totalAmountUsd: number;
  totalAmountVes: number;
}

export function SalesSummaryBlock({ currentExchangeRate, totalAmountUsd, totalAmountVes }: SalesSummaryBlockProps) {
  return (
    <section className="bg-background flex flex-col rounded-md border">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Tasa</span>
        <span className="text-muted-foreground text-xs font-medium tabular-nums">
          {formatCurrencyVES(currentExchangeRate)}
        </span>
      </div>

      <div className="bg-muted/10 flex flex-col gap-1 border-t px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Total USD</span>
          <span className="text-foreground text-sm font-bold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Total Bs</span>
          <span className="text-foreground/80 text-sm font-semibold tabular-nums">
            {formatCurrencyVES(totalAmountVes)}
          </span>
        </div>
      </div>
    </section>
  );
}
