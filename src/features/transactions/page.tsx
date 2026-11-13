import { useTransactions, useTodayTransactions } from "./hooks/useTransactionQueries";
import { useTodayReturns } from "@/features/returns/hooks/useReturnQueries";
import { useCashCloseSummary } from "@/features/cash-closes/hooks/useCashCloseQueries";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { SalesSummary } from "./components/sales-summary";
import { Route } from "@/routes/_app/transactions";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { AttachCasheaOrderDialog } from "@/features/cashea/components/attach-cashea-order-dialog";
import { formatDateForBackend } from "@/utils/formatters";
import type { TransactionsTableMeta } from "./columns";
import { canAttachCasheaOrder } from "./sales-display";

export function TransactionsPage() {
  // Date filter lives in the URL search params (enables deep-linking from cash-closes)
  const { date } = Route.useSearch();
  const navigate = useNavigate({ from: "/transactions" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const { data: transactions, isLoading, isError, isFetching, refetch } = useTransactions(date);
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
  const [attachSaleId, setAttachSaleId] = useState<string | null>(null);
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
  const [attachDialogKey, setAttachDialogKey] = useState(0);
  const attachSaleLines = (transactions ?? []).filter((transaction) => transaction.sale_id === attachSaleId);

  const today = formatDateForBackend(new Date());
  const tableMeta: TransactionsTableMeta = {
    canAttachCasheaOrder: (transaction) => canAttachCasheaOrder(transaction, { isAdmin, today }),
    onAttachCasheaOrder: (saleId) => {
      setAttachSaleId(saleId);
      setAttachDialogKey((key) => key + 1);
      setIsAttachDialogOpen(true);
    },
  };

  const isSummaryLoading = isTodayTransactionsLoading || isTodayReturnsLoading || isTodayCashCloseSummaryLoading;
  const isSummaryError =
    isTodayTransactionsError || isTodayReturnsError || (isTodayCashCloseSummaryError && !todayCashCloseSummary);

  const topbarProps = { date, onDateChange: setDate };

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
          data={transactions || []}
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
      <Topbar {...topbarProps} />
      {renderMetrics()}
      {renderContent()}
      {attachSaleId && (
        <AttachCasheaOrderDialog
          key={attachDialogKey}
          isOpen={isAttachDialogOpen}
          onOpenChange={setIsAttachDialogOpen}
          saleId={attachSaleId}
          saleLines={attachSaleLines}
        />
      )}
    </section>
  );
}
