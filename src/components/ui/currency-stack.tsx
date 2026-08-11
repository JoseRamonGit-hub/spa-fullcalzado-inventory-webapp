import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

type CurrencyStackProps = {
  usd: number;
  ves: number;
  emphasized?: boolean;
  className?: string;
};

export function CurrencyStack({ usd, ves, emphasized = false, className }: CurrencyStackProps) {
  return (
    <div className={cn("mt-1 grid max-w-full gap-0.5", className)}>
      <p className="flex max-w-full min-w-0 items-baseline gap-2">
        <span className="text-muted-foreground w-7 shrink-0 text-[11px] font-semibold uppercase">USD</span>
        <span
          className={cn(
            "data-value min-w-0 text-xs leading-tight break-words sm:text-sm",
            emphasized ? "font-bold" : "font-semibold",
          )}
        >
          {formatCurrencyUSD(usd)}
        </span>
      </p>
      <p className="flex max-w-full min-w-0 items-baseline gap-2">
        <span className="text-muted-foreground w-7 shrink-0 text-[11px] font-semibold">Bs.</span>
        <span
          className={cn(
            "data-value min-w-0 text-xs leading-tight break-words sm:text-sm",
            emphasized ? "font-bold" : "font-semibold",
          )}
        >
          {formatCurrencyVES(ves, { includeCurrency: false })}
        </span>
      </p>
    </div>
  );
}
