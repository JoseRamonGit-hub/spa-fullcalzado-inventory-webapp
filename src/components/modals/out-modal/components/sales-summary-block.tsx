import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

interface SalesSummaryBlockProps {
  currentExchangeRate: number;
  totalAmountUsd: number;
  totalAmountVes: number;
}

export function SalesSummaryBlock({ currentExchangeRate, totalAmountUsd, totalAmountVes }: SalesSummaryBlockProps) {
  return (
    <>
      {/* Desktop: stacked card */}
      <section className="bg-background hidden flex-col rounded-md border md:flex">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Tasa</span>
          <span className="text-muted-foreground text-[11px] font-medium tabular-nums">
            {formatCurrencyVES(currentExchangeRate)}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 border-t px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Total USD</span>
            <span className="text-foreground text-sm font-bold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">Total Bs</span>
            <span className="text-foreground/70 text-[13px] font-semibold tabular-nums">
              {formatCurrencyVES(totalAmountVes)}
            </span>
          </div>
        </div>
      </section>

      {/* Mobile: compact 3-column grid */}
      <section className="bg-background grid grid-cols-3 gap-2 rounded-md border p-2 md:hidden">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Tasa</p>
          <p className="truncate text-[11px] font-medium tabular-nums">{formatCurrencyVES(currentExchangeRate)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">USD</p>
          <p className="truncate text-[11px] font-semibold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Bs</p>
          <p className="truncate text-[11px] font-semibold tabular-nums">{formatCurrencyVES(totalAmountVes)}</p>
        </div>
      </section>
    </>
  );
}
