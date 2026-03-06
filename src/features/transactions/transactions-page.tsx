import { useMemo } from "react";
import { useTransactions, useTodayTransactions } from "./hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, DollarSign, Banknote } from "lucide-react";

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
          <div className="grid grid-cols-3 gap-4">
            {metricItems.map((m) => (
              <div key={m.label} className="flex items-center gap-2.5">
                <m.icon className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {m.label}
                  </p>
                  <p className="text-lg font-bold tabular-nums leading-tight">{m.value}</p>
                </div>
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
