import { useTransactions, useTodayTransactions } from "./hooks/useTransactionQueries";
import { useTodayReturns } from "@/features/returns/hooks/useReturnQueries";
import { useCashCloseSummary } from "@/features/cash-closes/hooks/useCashCloseQueries";
import { DatePickerFilter } from "@/components/ui/date-picker-filter";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns, saleRowClassName } from "./columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { SalesSummary } from "./components/sales-summary";
import { Route } from "@/routes/_app/transactions";
import { useNavigate } from "@tanstack/react-router";
import { useDialogTarget } from "@/hooks/use-dialog-target";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { AttachCasheaOrderDialog } from "@/features/cashea/components/attach-cashea-order-dialog";
import { formatDateForBackend } from "@/utils/formatters";
import type { TransactionsTableMeta } from "./columns";
import { canAttachCasheaOrder, groupSaleRows } from "./sales-display";

export function TransactionsPage() {
  // Date filter lives in the URL search params (enables deep-linking from cash-closes)
  const { date } = Route.useSearch();
  const navigate = useNavigate({ from: "/transactions" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const { data: transactions, isLoading, isError, isFetching, refetch } = useTransactions(date);
  const saleRows = groupSaleRows(transactions ?? []);
  const {
    data: todayTransactions,
    isLoading: isTodayTransactionsLoading,
    isError: isTodayTransactionsError,
  } = useTodayTransactions();
  const { data: todayReturns, isLoading: isTodayReturnsLoading, isError: isTodayReturnsError } = useTodayReturns();
  // El Por cobrar Cashea y el Cashea anulado por devolución vienen del resumen del cierre de hoy.
  const {
    data: todayCashCloseSummary,
    isLoading: isTodayCashCloseSummaryLoading,
    isError: isTodayCashCloseSummaryError,
  } = useCashCloseSummary();

  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const attachDialog = useDialogTarget<string>();
  const attachSaleLines = (transactions ?? []).filter((transaction) => transaction.sale_id === attachDialog.target);

  const today = formatDateForBackend(new Date());
  const tableMeta: TransactionsTableMeta = {
    canAttachCasheaOrder: (transaction) => canAttachCasheaOrder(transaction, { isAdmin, today }),
    onAttachCasheaOrder: attachDialog.open,
  };

  const isSummaryLoading = isTodayTransactionsLoading || isTodayReturnsLoading || isTodayCashCloseSummaryLoading;
  const isSummaryError =
    isTodayTransactionsError || isTodayReturnsError || (isTodayCashCloseSummaryError && !todayCashCloseSummary);

  function renderMetrics() {
    if (isSummaryLoading) {
      return <MetricsSkeleton count={3} />;
    }

    if (isSummaryError) {
      return (
        <div className="border-b px-3 py-3 md:px-4">
          <p className="text-destructive text-sm">
            No pudimos calcular el resumen. Recarga la página para intentarlo de nuevo.
          </p>
        </div>
      );
    }

    if (!todayCashCloseSummary) {
      return <MetricsSkeleton count={3} />;
    }

    return (
      <SalesSummary
        transactions={todayTransactions || []}
        returns={todayReturns || []}
        cashea={todayCashCloseSummary}
      />
    );
  }

  function renderContent() {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <DataTable
          columns={columns}
          paginationNoun="ventas"
          initialSorting={[{ id: "created_at", desc: true }]}
          data={saleRows}
          getSubRows={(row) => row.lines}
          getRowClassName={saleRowClassName}
          isLoading={isLoading}
          errorState={
            isError && !transactions
              ? { title: "No pudimos cargar las ventas", onRetry: refetch, isRetrying: isFetching }
              : undefined
          }
          getRowId={(row) => row.id}
          meta={tableMeta}
          emptyMessage={date ? "No hay ventas registradas para esta fecha." : "No hay ventas en los últimos 30 días."}
          scrollAreaLabel="Ventas"
        />
      </div>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar />
      {renderMetrics()}
      <div className="bg-background flex items-center justify-between gap-2 border-b px-3 py-1 md:px-4">
        <h2 className="text-sm font-medium">Historial de ventas</h2>
        <DatePickerFilter value={date} onChange={setDate} placeholder="Últimos 30 días" />
      </div>
      {renderContent()}
      {attachDialog.target && (
        <AttachCasheaOrderDialog
          key={attachDialog.key}
          isOpen={attachDialog.isOpen}
          onOpenChange={attachDialog.setIsOpen}
          saleId={attachDialog.target}
          saleLines={attachSaleLines}
        />
      )}
    </section>
  );
}
