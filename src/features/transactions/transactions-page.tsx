import { useMemo } from "react";
import { useTransactions, useTodayTransactions } from "./hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
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
      <section className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <div className="custom-scrollbar flex flex-1 flex-col overflow-auto">
          <MetricsSkeleton count={3} />
          <div className="flex flex-1 flex-col">
            <div className="px-3 pt-3 pb-2 md:px-4">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Histórico</h3>
            </div>
            <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-1 flex-col">
        <Topbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar las ventas.</p>
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
      label: "Total Bs Hoy",
      value: `Bs ${fmtVes(metrics.totalVes)}`,
      icon: Banknote,
    },
  ];

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <Topbar />

      <div className="custom-scrollbar flex flex-1 flex-col overflow-auto">
        {/* Flat metrics — no nested cards */}
        <div className="border-b px-3 py-3 md:px-4">
          <div className="divide-border/50 grid grid-cols-3 divide-x">
            {metricItems.map((m, i) => (
              <div
                key={m.label}
                className={cn(
                  "flex min-w-0 flex-col gap-1.5 px-2 sm:px-4",
                  i === 0 ? "pl-0" : "",
                  i === metricItems.length - 1 ? "pr-0" : "",
                )}
              >
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <m.icon className="text-primary h-3.5 w-3.5 shrink-0" />
                  <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">{m.label}</p>
                </div>
                <p className="truncate text-sm leading-none font-bold tabular-nums sm:text-lg" title={m.value}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Historical table */}
        <div className="flex flex-1 flex-col">
          <div className="px-3 pt-3 pb-2 md:px-4">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Histórico</h3>
          </div>
          <DataTable columns={columns} data={transactions || []} emptyMessage="No hay ventas registradas." />
        </div>
      </div>
    </section>
  );
}
