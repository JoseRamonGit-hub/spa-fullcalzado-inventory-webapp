import { useMemo } from "react";
import { useTransactions, useTodayTransactions } from "./hooks/useTransactions";
import { useReturns, useTodayReturns } from "@/features/returns/hooks/useReturns";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { ShoppingCart, DollarSign, Banknote, CalendarDays, IterationCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";
import { Route } from "@/routes/_app/transactions";
import { useNavigate } from "@tanstack/react-router";

export function TransactionsPage() {
  // Date filter lives in the URL search params (enables deep-linking from cash-closes)
  const { date } = Route.useSearch();
  const navigate = useNavigate({ from: "/transactions" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const isFiltered = !!date;

  const { data: transactions, isLoading, isError } = useTransactions(date);
  const {
    data: todayTxs,
    isLoading: isTodayTxsLoading,
    isError: isTodayTxsError,
  } = useTodayTransactions({ enabled: !isFiltered });
  const {
    data: filteredReturns,
    isLoading: isFilteredReturnsLoading,
    isError: isFilteredReturnsError,
  } = useReturns(date, { enabled: isFiltered });
  const {
    data: todayReturns,
    isLoading: isTodayReturnsLoading,
    isError: isTodayReturnsError,
  } = useTodayReturns({ enabled: !isFiltered });

  const sourceTxs = isFiltered ? transactions : todayTxs;
  const sourceReturns = isFiltered ? filteredReturns : todayReturns;
  const isMetricsLoading = isFiltered
    ? isLoading || isFilteredReturnsLoading
    : isTodayTxsLoading || isTodayReturnsLoading;
  const hasMetricsError = isFiltered ? isError || isFilteredReturnsError : isTodayTxsError || isTodayReturnsError;

  const metrics = useMemo(() => {
    // Guard: same race-condition fix as cash-closes — don't subtract returns
    // credit from a zero transactions total while txs are still loading.
    if (sourceTxs === undefined) {
      return {
        count: 0,
        totalUsd: 0,
        totalVes: 0,
        returnsCount: 0,
        returnsCreditUsd: 0,
        returnsCreditVes: 0,
        netUsd: 0,
        netVes: 0,
      };
    }

    const txMetrics = sourceTxs.reduce(
      (acc, tx) => ({
        count: acc.count + 1,
        totalUsd: acc.totalUsd + tx.price_usd * tx.quantity,
        totalVes: acc.totalVes + tx.price_ves * tx.quantity,
      }),
      { count: 0, totalUsd: 0, totalVes: 0 },
    );

    const retMetrics = (sourceReturns || []).reduce(
      (acc, ret) => ({
        count: acc.count + 1,
        creditUsd: acc.creditUsd + ret.credit_usd,
        creditVes: acc.creditVes + ret.credit_ves,
      }),
      { count: 0, creditUsd: 0, creditVes: 0 },
    );

    return {
      ...txMetrics,
      returnsCount: retMetrics.count,
      returnsCreditUsd: retMetrics.creditUsd,
      returnsCreditVes: retMetrics.creditVes,
      netUsd: txMetrics.totalUsd - retMetrics.creditUsd,
      netVes: txMetrics.totalVes - retMetrics.creditVes,
    };
  }, [sourceTxs, sourceReturns]);

  const hasReturns = metrics.returnsCount > 0;
  const metricsLabel = isFiltered ? `Ventas del ${formatDate(date + "T12:00:00")}` : "Ventas de Hoy";
  const metricsErrorMessage = isFiltered
    ? "No se pudo cargar el resumen de devoluciones para la fecha filtrada."
    : "No se pudo cargar el resumen del día en este momento.";

  const topbarProps = { date, onDateChange: setDate };

  const metricItems = hasReturns
    ? [
        { label: "Ventas", value: String(metrics.count), icon: ShoppingCart, color: "" },
        { label: "Total Facturado USD", value: formatCurrencyUSD(metrics.totalUsd), icon: DollarSign, color: "" },
        { label: "Devol.", value: String(metrics.returnsCount), icon: IterationCcw, color: "text-orange-500" },
        {
          label: "Total Producido USD",
          value: formatCurrencyUSD(metrics.netUsd),
          icon: DollarSign,
          color: "text-primary",
        },
      ]
    : [
        { label: "Ventas", value: String(metrics.count), icon: ShoppingCart, color: "" },
        { label: "Total Producido USD", value: formatCurrencyUSD(metrics.totalUsd), icon: DollarSign, color: "" },
        { label: "Total Producido Bs.", value: formatCurrencyVES(metrics.totalVes), icon: Banknote, color: "" },
      ];

  function renderMetrics() {
    if (isMetricsLoading) {
      return <MetricsSkeleton count={hasReturns ? 4 : 3} />;
    }

    if (hasMetricsError) {
      return (
        <div className="border-b px-3 py-3 md:px-4">
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {metricsErrorMessage}
          </div>
        </div>
      );
    }

    return (
      <div className="shrink-0 border-b px-3 py-3 md:px-4">
        <div className="mb-2 flex items-center gap-1.5">
          {isFiltered && (
            <span className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
              <CalendarDays className="h-3 w-3" />
              Filtrado
            </span>
          )}
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{metricsLabel}</h3>
        </div>
        <div className={cn("divide-border/50 grid divide-x", hasReturns ? "grid-cols-4" : "grid-cols-3")}>
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
                <m.icon className={cn("h-3.5 w-3.5 shrink-0", m.color || "text-primary")} />
                <p className="truncate text-[9px] font-medium tracking-wider uppercase sm:text-[10px]">{m.label}</p>
              </div>
              <p
                className={cn("truncate text-sm leading-none font-bold tabular-nums sm:text-lg", m.color)}
                title={m.value}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar las ventas.</p>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <DataTable columns={columns} data={transactions || []} emptyMessage="No hay ventas registradas." />
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar {...topbarProps} />
      {renderMetrics()}
      {renderContent()}
    </section>
  );
}
