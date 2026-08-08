import { useTransactions, useTodayTransactions } from "./hooks/useTransactionQueries";
import { useTodayReturns } from "@/features/returns/hooks/useReturnQueries";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { SalesSummary } from "./components/sales-summary";
import { Route } from "@/routes/_app/transactions";
import { useNavigate } from "@tanstack/react-router";

export function TransactionsPage() {
  // Date filter lives in the URL search params (enables deep-linking from cash-closes)
  const { date } = Route.useSearch();
  const navigate = useNavigate({ from: "/transactions" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const { data: transactions, isLoading, isError } = useTransactions(date);
  const {
    data: todayTransactions,
    isLoading: isTodayTransactionsLoading,
    isError: isTodayTransactionsError,
  } = useTodayTransactions();
  const { data: todayReturns, isLoading: isTodayReturnsLoading, isError: isTodayReturnsError } = useTodayReturns();

  const isSummaryLoading = isTodayTransactionsLoading || isTodayReturnsLoading;
  const isSummaryError = isTodayTransactionsError || isTodayReturnsError;

  const topbarProps = { date, onDateChange: setDate };

  function renderMetrics() {
    if (isSummaryLoading) {
      return <MetricsSkeleton count={3} />;
    }

    if (isSummaryError) {
      return (
        <div className="border-b px-3 py-3 md:px-4">
          <p className="text-destructive text-sm">No se pudo calcular el resumen del período.</p>
        </div>
      );
    }

    return <SalesSummary transactions={todayTransactions || []} returns={todayReturns || []} />;
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
        <DataTable
          columns={columns}
          data={transactions || []}
          getRowId={(row) => row.id}
          emptyMessage={date ? "No hay ventas registradas para esta fecha." : "No hay ventas en los últimos 30 días."}
        />
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
