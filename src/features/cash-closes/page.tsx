import { useMemo, useState } from "react";
import { useCashCloses } from "./hooks/useCashCloses";
import { useTransactions, useTodayTransactions } from "@/features/transactions/hooks/useTransactions";
import { useReturns, useTodayReturns } from "@/features/returns/hooks/useReturns";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { cashClosesService } from "@/services/cashClosesService";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { formatDate } from "@/utils/formatters";
import type { CashClose } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { MetricsSummary } from "./components/metrics-summary";
import { CashCloseModal } from "./components/cash-close-modal";

export function CashClosesPage() {
  const [date, setDate] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: cashCloses, isLoading, isError } = useCashCloses(date);
  const { data: filteredTxs } = useTransactions(date);
  const { data: todayTxs } = useTodayTransactions();
  const { data: filteredReturns } = useReturns(date);
  const { data: todayReturns } = useTodayReturns();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate({ from: "/cash-closes" });

  const isFiltered = !!date;
  const sourceTxs = isFiltered ? filteredTxs : todayTxs;
  const sourceReturns = isFiltered ? filteredReturns : todayReturns;

  const todayMetrics = useMemo(() => {
    const zero = { count: 0, units: 0, totalUsd: 0, totalVes: 0, returnsCount: 0, returnsCreditUsd: 0, returnsCreditVes: 0, netUsd: 0, netVes: 0 };

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

  const closeMutation = useMutation({
    mutationFn: (userId: string) => cashClosesService.generateDailyCashClose(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-closes"] });
      queryClient.invalidateQueries({ queryKey: ["transactions", "today"] });
    },
  });

  const handleConfirmClose = () => {
    if (!user) return;
    const promise = closeMutation.mutateAsync(user.id);
    toast.promise(promise, {
      loading: "Generando cierre de caja...",
      success: "Cierre realizado correctamente",
      error: "Error al realizar el cierre",
    });
  };

  const handleRowClick = (row: CashClose) => {
    navigate({ to: "/transactions", search: { date: row.date } });
  };

  const today = formatDate(new Date());
  const summaryLabel = isFiltered ? `Resumen del ${formatDate(date + "T12:00:00")}` : `Resumen del Día — ${today}`;

  const topbar = <Topbar date={date} onDateChange={setDate} />;

  if (isLoading) {
    return (
      <main className="flex min-h-0 flex-1 flex-col">
        {topbar}
        <MetricsSkeleton count={4} />
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="shrink-0 px-3 pt-3 pb-2 md:px-4">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Cierres Anteriores
            </h3>
          </header>
          <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="flex flex-1 flex-col">
        {topbar}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar los cierres de caja.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {topbar}

      {/* Metrics — fixed at top, never scrolls */}
      <MetricsSummary
        metrics={todayMetrics}
        label={summaryLabel}
        isFiltered={isFiltered}
        onOpenConfirm={() => setConfirmOpen(true)}
        isPending={closeMutation.isPending}
        hasUser={!!user}
      />

      {/* Table — fills remaining space, pagination pinned at bottom */}
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 px-3 pt-3 pb-2 md:px-4">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {isFiltered ? "Cierre encontrado" : "Cierres Anteriores"}
          </h3>
        </header>
        <DataTable
          columns={columns}
          data={cashCloses || []}
          emptyMessage="No hay cierres de caja registrados."
          onRowClick={handleRowClick}
        />
      </div>

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
