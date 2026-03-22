import { useMemo, useState } from "react";
import { useCashCloses } from "./hooks/useCashCloseQueries";
import { useGenerateCashClose } from "./hooks/useCashCloseMutations";
import { useTransactions, useTodayTransactions } from "@/features/transactions/hooks/useTransactionQueries";
import { useReturns, useTodayReturns } from "@/features/returns/hooks/useReturnQueries";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { formatDate } from "@/utils/formatters";
import type { CashCloseWithRelations } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { MetricsSummary } from "./components/metrics-summary";
import { CashCloseModal } from "./components/cash-close-modal";
import { Route } from "@/routes/_app/cash-closes";

export function CashClosesPage() {
  const { date } = Route.useSearch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isFiltered = !!date;

  const { data: cashCloses, isLoading, isError } = useCashCloses(date);
  const {
    data: filteredTxs,
    isLoading: isFilteredTxsLoading,
    isError: isFilteredTxsError,
  } = useTransactions(date, { enabled: isFiltered });
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
  const closeMutation = useGenerateCashClose();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate({ from: "/cash-closes" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const sourceTxs = isFiltered ? filteredTxs : todayTxs;
  const sourceReturns = isFiltered ? filteredReturns : todayReturns;
  const isMetricsLoading = isFiltered
    ? isFilteredTxsLoading || isFilteredReturnsLoading
    : isTodayTxsLoading || isTodayReturnsLoading;
  const hasMetricsError = isFiltered
    ? isFilteredTxsError || isFilteredReturnsError
    : isTodayTxsError || isTodayReturnsError;

  const todayMetrics = useMemo(() => {
    const zero = {
      count: 0,
      units: 0,
      totalUsd: 0,
      totalVes: 0,
      returnsCount: 0,
      returnsCreditUsd: 0,
      returnsCreditVes: 0,
      netUsd: 0,
      netVes: 0,
    };

    // Guard: if transactions haven't loaded yet, return zeros to avoid a
    // negative net when returns cache is warm but transactions are still fetching.
    if (sourceTxs === undefined) return zero;

    const txMetrics = sourceTxs.reduce(
      (acc, tx) => ({
        count: acc.count + 1,
        units: acc.units + tx.quantity,
        totalUsd: acc.totalUsd + tx.price_usd * tx.quantity,
        totalVes: acc.totalVes + tx.price_ves * tx.quantity,
      }),
      { count: 0, units: 0, totalUsd: 0, totalVes: 0 },
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

  const handleConfirmClose = () => {
    if (!user) return;
    const promise = closeMutation.mutateAsync(user.id);
    toast.promise(promise, {
      loading: "Generando cierre de caja...",
      success: "Cierre realizado correctamente",
      error: "Error al realizar el cierre",
    });
  };

  const handleRowClick = (row: CashCloseWithRelations) => {
    navigate({ to: "/transactions", search: { date: row.date } });
  };

  const today = formatDate(new Date());
  const summaryLabel = isFiltered ? `Resumen del ${formatDate(date + "T12:00:00")}` : `Resumen del Día — ${today}`;
  const metricsErrorMessage = isFiltered
    ? "No se pudo cargar el resumen de la fecha filtrada."
    : "No se pudo cargar el resumen del día en este momento.";

  function renderSummary() {
    if (isMetricsLoading) {
      return <MetricsSkeleton count={4} />;
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
      <MetricsSummary
        metrics={todayMetrics}
        label={summaryLabel}
        isFiltered={isFiltered}
        onOpenConfirm={() => setConfirmOpen(true)}
        isPending={closeMutation.isPending}
        hasUser={!!user}
      />
    );
  }

  function renderContent() {
    if (isLoading) {
      return <DataTable columns={columns} data={[]} isLoading emptyMessage="" />;
    }

    if (isError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar los cierres de caja.</p>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <DataTable
          columns={columns}
          data={cashCloses || []}
          getRowId={(row) => row.id}
          emptyMessage="No hay cierres de caja registrados."
          onRowClick={handleRowClick}
        />
      </div>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Topbar date={date} onDateChange={setDate} />
      {renderSummary()}
      {renderContent()}

      <CashCloseModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isPending={closeMutation.isPending}
        onConfirm={handleConfirmClose}
        today={today}
        metrics={todayMetrics}
      />
    </main>
  );
}
