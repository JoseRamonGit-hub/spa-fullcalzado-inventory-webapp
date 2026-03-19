import { Hash, DollarSign, Banknote, ShoppingCart, CalendarDays, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface MetricsSummaryProps {
  metrics: { count: number; units: number; totalUsd: number; totalVes: number };
  label: string;
  isFiltered: boolean;
  onOpenConfirm: () => void;
  isPending: boolean;
  hasUser: boolean;
}

export function MetricsSummary({ metrics, label, isFiltered, onOpenConfirm, isPending, hasUser }: MetricsSummaryProps) {
  const summaryItems = [
    { label: "Transacciones", value: String(metrics.count), icon: Hash },
    { label: "Unidades Vendidas", value: String(metrics.units), icon: ShoppingCart },
    { label: "Total USD", value: formatCurrencyUSD(metrics.totalUsd), icon: DollarSign },
    { label: "Total Bs", value: formatCurrencyVES(metrics.totalVes), icon: Banknote },
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

      <ul className="grid grid-cols-2 gap-y-4 md:grid-cols-4">
        {summaryItems.map((item, i) => (
          <li
            key={item.label}
            className={cn(
              "border-border/50 flex min-w-0 flex-col gap-1.5 px-2 sm:px-4",
              i % 2 !== 0 ? "border-l" : "",
              "md:border-l",
              i === 0 ? "pl-0 md:border-l-0" : "",
              i === 2 ? "border-l-0 pl-0 md:border-l md:pl-4" : "",
              i === summaryItems.length - 1 ? "pr-0" : "",
            )}
          >
            <div className="text-muted-foreground flex items-center gap-1.5">
              <item.icon className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">{item.label}</p>
            </div>
            <p className="truncate text-sm leading-none font-bold tabular-nums sm:text-lg" title={item.value}>
              {item.value}
            </p>
          </li>
        ))}
      </ul>

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
