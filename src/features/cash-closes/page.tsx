import { useState } from "react";
import { useCashCloses, useCashCloseSummary } from "./hooks/useCashCloseQueries";
import { useGenerateCashClose } from "./hooks/useCashCloseMutations";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { formatDate } from "@/utils/formatters";
import type { CashCloseSummary, CashCloseWithRelations } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { MetricsSummary } from "./components/metrics-summary";
import { CashCloseModal } from "./components/cash-close-modal";
import { Route } from "@/routes/_app/cash-closes";

const EMPTY_CASH_CLOSE_SUMMARY: CashCloseSummary = {
  billedOperations: 0,
  units: 0,
  totalUsd: 0,
  totalVes: 0,
  returnsCount: 0,
  returnsCreditUsd: 0,
  returnsCreditVes: 0,
  netUsd: 0,
  netVes: 0,
};

export function CashClosesPage() {
  const { date } = Route.useSearch();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isFiltered = !!date;

  const { data: cashCloses, isLoading, isError } = useCashCloses(date);
  const { data: cashCloseSummary, isLoading: isMetricsLoading, isError: hasMetricsError } = useCashCloseSummary(date);
  const closeMutation = useGenerateCashClose();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate({ from: "/cash-closes" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const todayMetrics = cashCloseSummary ?? EMPTY_CASH_CLOSE_SUMMARY;

  const handleConfirmClose = async () => {
    if (!user) return;

    const promise = closeMutation.mutateAsync(undefined);
    toast.promise(promise, {
      loading: "Generando cierre de caja...",
      success: "Cierre realizado correctamente",
      error: "Error al realizar el cierre",
    });

    try {
      await promise;
      setConfirmOpen(false);
    } catch {
      // The mutation error is presented by the toast while the dialog remains open.
    }
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
