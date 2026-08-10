import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

type SalesSummaryBlockProps = {
  exchangeRate: ModalExchangeRate;
  totalAmountUsd: number;
  totalAmountVes: number;
};

export function SalesSummaryBlock({ exchangeRate, totalAmountUsd, totalAmountVes }: SalesSummaryBlockProps) {
  return (
    <>
      {/* Desktop: payment summary */}
      <section className="bg-card hidden h-72 flex-col justify-between rounded-md border p-4 md:flex">
        <div>
          <p className="text-muted-foreground text-[10px] font-semibold uppercase">Resumen de cobro</p>
          <p className="text-muted-foreground mt-1 text-xs">Total calculado con la tasa vigente.</p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold uppercase">Total USD</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</p>
          </div>

          <div className="border-border/70 border-t pt-3">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase">Total Bs</p>
            <p className="text-foreground/75 mt-1 text-sm font-semibold tabular-nums">
              {exchangeRate.isReady ? formatCurrencyVES(totalAmountVes) : "—"}
            </p>
          </div>
        </div>

        <div className="border-border/70 border-t pt-3">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase">Tasa</p>
          <p className="text-muted-foreground mt-1 text-xs font-medium tabular-nums">
            {exchangeRate.isLoading ? "..." : exchangeRate.displayValue}
          </p>
        </div>
      </section>

      {/* Mobile: compact payment summary */}
      <section className="bg-card rounded-md border p-3 md:hidden">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase">Total USD</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</p>
        </div>

        <div className="border-border/70 mt-3 grid grid-cols-2 gap-3 border-t pt-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase">Bs</p>
            <OverflowTooltip className="text-xs font-semibold tabular-nums">
              {exchangeRate.isReady ? formatCurrencyVES(totalAmountVes) : "—"}
            </OverflowTooltip>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase">Tasa</p>
            <OverflowTooltip className="text-xs font-medium tabular-nums">
              {exchangeRate.isLoading ? "..." : exchangeRate.displayValue}
            </OverflowTooltip>
          </div>
        </div>
      </section>
    </>
  );
}
