import { useMemo } from "react";
import { useTransactions, useTodayTransactions } from "./hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, DollarSign, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransactionsPage() {
  const { data: transactions, isLoading, isError } = useTransactions();
  const { data: todayTxs } = useTodayTransactions();

  // Metrics from today's transactions — VES is summed from stored values, NOT multiplied by current rate
  const metrics = useMemo(() => {
    if (!todayTxs || todayTxs.length === 0) {
      return { count: 0, totalUsd: 0, totalVes: 0 };
    }
    return todayTxs.reduce(
      (acc, tx) => ({
        count: acc.count + 1,
        totalUsd: acc.totalUsd + tx.price_usd * tx.quantity,
        totalVes: acc.totalVes + tx.price_ves * tx.quantity,
      }),
      { count: 0, totalUsd: 0, totalVes: 0 },
    );
  }, [todayTxs]);

  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const fmtVes = (value: number) =>
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  if (isLoading) {
    return (
      <section className="flex flex-col flex-1">
        <Topbar />
        <div className="p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col flex-1">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Error al cargar las ventas.</p>
        </div>
      </section>
    );
  }

  const metricItems = [
    {
      label: "Ventas Hoy",
      value: String(metrics.count),
      icon: ShoppingCart,
    },
    {
      label: "Total USD Hoy",
      value: `$${fmtCurrency(metrics.totalUsd)}`,
      icon: DollarSign,
    },
    {
      label: "Total VES Hoy",
      value: `Bs ${fmtVes(metrics.totalVes)}`,
      icon: Banknote,
    },
  ];

  return (
    <section className="flex flex-col flex-1 overflow-hidden">
      <Topbar />

      <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
        {/* Flat metrics — no nested cards */}
        <div className="px-3 md:px-4 py-3 border-b">
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {metricItems.map((m, i) => (
              <div
                key={m.label}
                className={cn(
                  "flex flex-col gap-1.5 px-2 sm:px-4 min-w-0",
                  i === 0 ? "pl-0" : "",
                  i === metricItems.length - 1 ? "pr-0" : "",
                )}
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <m.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider truncate">{m.label}</p>
                </div>
                <p className="text-sm sm:text-lg font-bold tabular-nums leading-none truncate" title={m.value}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Historical table */}
        <div className="flex flex-col flex-1">
          <div className="px-3 md:px-4 pt-3 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Histórico</h3>
          </div>
          <DataTable columns={columns} data={transactions || []} emptyMessage="No hay ventas registradas." />
        </div>
      </div>
    </section>
  );
}
