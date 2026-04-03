import { Hash, DollarSign, Banknote, ShoppingCart, CalendarDays, Lock, IterationCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export type CashCloseMetrics = {
  count: number;
  units: number;
  totalUsd: number;
  totalVes: number;
  returnsCount: number;
  returnsCreditUsd: number;
  returnsCreditVes: number;
  netUsd: number;
  netVes: number;
};

type MetricsSummaryProps = {
  metrics: CashCloseMetrics;
  label: string;
  isFiltered: boolean;
  onOpenConfirm: () => void;
  isPending: boolean;
  hasUser: boolean;
};

export function MetricsSummary({ metrics, label, isFiltered, onOpenConfirm, isPending, hasUser }: MetricsSummaryProps) {
  const hasReturns = metrics.returnsCount > 0;

  const salesItems = [
    { label: "Ventas", value: String(metrics.count), icon: Hash },
    { label: "Unidades", value: String(metrics.units), icon: ShoppingCart },
    { label: "Total Facturado USD", value: formatCurrencyUSD(metrics.totalUsd), icon: DollarSign },
    { label: "Total Facturado Bs", value: formatCurrencyVES(metrics.totalVes), icon: Banknote },
  ];

  return (
    <div className="space-y-3 border-b px-3 py-3 md:px-4">
      <header className="flex items-center gap-1.5">
        {isFiltered && (
          <span className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
            <CalendarDays className="h-3 w-3" />
            Filtrado
          </span>
        )}
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{label}</h3>
      </header>

      {/* Sales row */}
      <ul className="grid grid-cols-2 gap-y-4 md:grid-cols-4">
        {salesItems.map((item, i) => (
          <li
            key={item.label}
            className={cn(
              "border-border/50 flex min-w-0 flex-col gap-1.5 px-2 sm:px-4",
              i % 2 !== 0 ? "border-l" : "",
              "md:border-l",
              i === 0 ? "pl-0 md:border-l-0" : "",
              i === 2 ? "border-l-0 pl-0 md:border-l md:pl-4" : "",
              i === salesItems.length - 1 ? "pr-0" : "",
            )}
          >
            <div className="text-muted-foreground flex items-center gap-1.5">
              <item.icon className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">{item.label}</p>
            </div>
            <p className="font-heading truncate text-sm leading-none font-bold tabular-nums sm:text-lg" title={item.value}>
              {item.value}
            </p>
          </li>
        ))}
      </ul>

      {/* Returns + Net row */}
      {hasReturns && (
        <div className="border-border/40 space-y-3 border-t pt-3">
          <ul className="grid grid-cols-3 gap-y-4">
            <li className="flex min-w-0 flex-col gap-1.5 pl-0">
              <div className="text-muted-foreground flex items-center gap-1.5">
                <IterationCcw className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden="true" />
                <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">Devoluciones</p>
              </div>
              <p className="truncate text-sm leading-none font-bold text-orange-500 tabular-nums sm:text-lg">
                {metrics.returnsCount}
              </p>
            </li>
            <li className="border-border/50 flex min-w-0 flex-col gap-1.5 border-l px-2 sm:px-4">
              <div className="text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden="true" />
                <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">
                  Crédito Devolución
                </p>
              </div>
              <p className="truncate text-sm leading-none font-bold text-orange-500 tabular-nums sm:text-lg">
                {formatCurrencyUSD(metrics.returnsCreditUsd)}
              </p>
            </li>
            <li className="border-border/50 flex min-w-0 flex-col gap-1.5 border-l px-2 pr-0 sm:px-4 sm:pr-0">
              <div className="text-muted-foreground flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden="true" />
                <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">Crédito Bs.</p>
              </div>
              <p className="truncate text-sm leading-none font-bold text-orange-500 tabular-nums sm:text-lg">
                {formatCurrencyVES(metrics.returnsCreditVes)}
              </p>
            </li>
          </ul>

          <div className="bg-primary/8 -mx-3 px-3 py-2.5 md:-mx-4 md:px-4">
            <ul className="grid grid-cols-2">
              <li className="flex min-w-0 flex-col gap-1.5 pl-0">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">
                    Total Producido USD
                  </p>
                </div>
                <p className="text-primary font-heading truncate text-sm leading-none font-bold tabular-nums sm:text-lg">
                  {formatCurrencyUSD(metrics.netUsd)}
                </p>
              </li>
              <li className="border-border/50 flex min-w-0 flex-col gap-1.5 border-l px-2 sm:px-4">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Banknote className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">
                    Total Producido BS.
                  </p>
                </div>
                <p className="text-primary font-heading truncate text-sm leading-none font-bold tabular-nums sm:text-lg">
                  {formatCurrencyVES(metrics.netVes)}
                </p>
              </li>
            </ul>
          </div>
        </div>
      )}

      {!isFiltered && (
        <Button
          onClick={onOpenConfirm}
          disabled={isPending || !hasUser}
          className="h-8 w-full gap-2 text-xs font-semibold"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {isPending ? "PROCESANDO..." : "CIERRE DE DÍA"}
        </Button>
      )}
    </div>
  );
}
