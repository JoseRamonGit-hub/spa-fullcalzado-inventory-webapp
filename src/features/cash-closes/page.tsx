import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useCasheaCollectionStatus } from "@/features/cashea/hooks/useCasheaQueries";
import { Route } from "@/routes/_app/cash-closes";
import { formatDate, formatDateForBackend } from "@/utils/formatters";
import {
  buildCashCloseHistory,
  getCashCloseDayState,
  getSummaryFigures,
  type CashCloseHistoryRow,
} from "./cash-close-ledger";
import { columns } from "./columns";
import { CashCloseModal } from "./components/cash-close-modal";
import { CashCloseSheet } from "./components/cash-close-sheet";
import { DayClosePanel, DayClosePanelSkeleton, type DayCloseState } from "./components/day-close-panel";
import { Topbar } from "./components/topbar";
import { useGenerateCashClose } from "./hooks/useCashCloseMutations";
import { useCashCloses, useCashCloseSummary, useUnclosedCashCloseDays } from "./hooks/useCashCloseQueries";

const OPEN_ROW_CLASS_NAME = "bg-primary/8 hover:bg-primary/10 shadow-[inset_2px_0_0_var(--color-primary)]";
/** Un día con ventas sin cierre es la excepción que el dueño busca: se ve al recorrer las fechas. */
const UNCLOSED_ROW_CLASS_NAME = "bg-warning/10 hover:bg-warning/15 shadow-[inset_2px_0_0_var(--color-warning)]";

export function CashClosesPage() {
  const { date, cashCloseId } = Route.useSearch();
  const navigate = useNavigate({ from: "/cash-closes" });
  const user = useAuthStore((s) => s.user);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setDetailSheetOpen = (isOpen: boolean) => {
    if (!isOpen && cashCloseId) {
      void navigate({
        replace: true,
        resetScroll: false,
        search: (prev) => ({ ...prev, cashCloseId: undefined }),
      });
    }
  };

  const openDetailSheet = (row: CashCloseHistoryRow) => {
    void navigate({
      resetScroll: false,
      search: (prev) => ({ ...prev, cashCloseId: row.id }),
    });
  };

  const { data: cashCloses, isLoading, isError, isFetching, refetch } = useCashCloses(date);
  const summaryQuery = useCashCloseSummary(date);
  const unclosedQuery = useUnclosedCashCloseDays();
  const { data: casheaStatuses } = useCasheaCollectionStatus(date);
  const closeMutation = useGenerateCashClose();

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const todayKey = formatDateForBackend(new Date());
  const viewedDate = date ?? todayKey;
  const isToday = viewedDate === todayKey;
  const viewedDateLabel = formatDate(`${viewedDate}T12:00:00`);
  const panelTitle = isToday ? `Hoy · ${viewedDateLabel}` : viewedDateLabel;

  const unclosedDays = unclosedQuery.data ?? [];
  const rows = buildCashCloseHistory({
    cashCloses: cashCloses ?? [],
    unclosedDays: date ? unclosedDays.filter((day) => day.date === date) : unclosedDays,
    casheaStatuses: casheaStatuses ?? [],
  });
  const detailRow = rows.find((row) => row.id === cashCloseId) ?? null;

  const figures = summaryQuery.data ? getSummaryFigures(summaryQuery.data) : null;
  const dayState: DayCloseState | null =
    isError || summaryQuery.isError
      ? {
          kind: "unverified",
          reason: isError ? "close" : "summary",
          isRetrying: (isError && isFetching) || (summaryQuery.isError && summaryQuery.isFetching),
          retry: () => {
            if (isError) refetch();
            if (summaryQuery.isError) summaryQuery.refetch();
          },
        }
      : figures && cashCloses
        ? getCashCloseDayState({
            viewedDate,
            todayKey,
            figures,
            cashClose: cashCloses.find((cashClose) => cashClose.date === viewedDate),
            // Con un día filtrado la lista solo trae ese cierre: no hay último cierre que comparar.
            lastClose: date ? undefined : cashCloses.find((cashClose) => cashClose.date < todayKey),
            unclosedDates: date ? [] : unclosedDays.map((day) => day.date),
          })
        : null;
  const update = dayState?.kind === "outdated" ? dayState : undefined;
  const canSave = Boolean(user && (dayState?.kind === "open" || dayState?.kind === "outdated"));

  if (confirmOpen && !canSave && !closeMutation.isPending) {
    setConfirmOpen(false);
  }

  const handleConfirmClose = async () => {
    if (!canSave || closeMutation.isPending) return;

    const promise = closeMutation.mutateAsync(undefined);
    toast.promise(promise, {
      loading: update ? "Actualizando el cierre…" : "Cerrando el día…",
      success: update ? "Cierre actualizado" : "Día cerrado",
      error: update ? "No se pudo actualizar el cierre" : "No se pudo cerrar el día",
    });

    try {
      await promise;
      setConfirmOpen(false);
    } catch {
      // El toast presenta el error y el diálogo sigue abierto para reintentar.
    }
  };

  const isHistoryLoading = isLoading || unclosedQuery.isLoading;
  const isHistoryFetching = isFetching || unclosedQuery.isFetching;
  const hasHistoryError = (isError && !cashCloses) || (unclosedQuery.isError && !unclosedQuery.data);
  const retryHistory = () => {
    if (isError) refetch();
    if (unclosedQuery.isError) unclosedQuery.refetch();
  };

  function renderDayPanel() {
    if (summaryQuery.isLoading || isLoading || (!cashCloses && !isError)) return <DayClosePanelSkeleton />;

    if (!figures || !dayState) {
      if (!summaryQuery.isError) return null;
      return (
        <div className="border-b px-3 py-3 md:px-4">
          <div
            role="alert"
            className="border-warning/30 bg-warning/10 text-warning-foreground flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
          >
            {isToday ? "No se pudo cargar el cuadre de hoy." : "No se pudo cargar el cuadre de la fecha filtrada."}
            <Button
              variant="outline"
              size="sm"
              onClick={() => summaryQuery.refetch()}
              disabled={summaryQuery.isFetching}
              className="shrink-0"
            >
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              {summaryQuery.isFetching ? "Reintentando…" : "Reintentar"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <DayClosePanel
        key={viewedDate}
        date={viewedDate}
        title={panelTitle}
        figures={figures}
        state={dayState}
        onRequestClose={() => setConfirmOpen(true)}
        isPending={closeMutation.isPending}
        canClose={canSave}
      />
    );
  }

  return (
    <main className="custom-scrollbar @container/cash-close flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
      <Topbar date={date} onDateChange={setDate} />
      {renderDayPanel()}

      <div className="flex min-h-64 min-w-0 flex-1 flex-col">
        <h2 className="shrink-0 px-3 pt-5 pb-2 text-sm font-semibold md:px-4 md:pt-7">Historial de cierres</h2>
        <DataTable
          tableClassName="[&_td]:px-2 [&_th]:px-2 [&_:is(th,td):nth-child(5)]:ps-6 [&_:is(th,td):first-child]:ps-3 md:[&_:is(th,td):first-child]:ps-4 md:[&_:is(th,td):last-child]:ps-4 [&_th_button]:leading-tight [&_th_button]:whitespace-nowrap [&_th_svg]:shrink-0"
          columns={columns}
          data={rows}
          isLoading={isHistoryLoading}
          errorState={
            hasHistoryError
              ? {
                  title: "No pudimos cargar los cierres de caja",
                  onRetry: retryHistory,
                  isRetrying: isHistoryFetching,
                }
              : undefined
          }
          getRowId={(row) => row.id}
          emptyMessage={date ? "Este día no tiene cierre de caja." : "Todavía no hay cierres de caja."}
          onRowClick={openDetailSheet}
          getRowClassName={(row) => {
            if (cashCloseId === row.id) return OPEN_ROW_CLASS_NAME;
            return row.original.kind === "unclosed" ? UNCLOSED_ROW_CLASS_NAME : undefined;
          }}
          getRowAriaLabel={(row) =>
            row.kind === "closed"
              ? `Ver el cierre del ${formatDate(`${row.date}T12:00:00`)}`
              : `Ver el ${formatDate(`${row.date}T12:00:00`)}, día con ventas sin cierre`
          }
          scrollAreaLabel="Tabla del historial de cierres"
        />
      </div>

      {figures && (
        <CashCloseModal
          open={confirmOpen && (canSave || closeMutation.isPending)}
          onOpenChange={setConfirmOpen}
          isPending={closeMutation.isPending}
          onConfirm={handleConfirmClose}
          dateLabel={viewedDateLabel}
          figures={figures}
          update={update}
        />
      )}

      <CashCloseSheet
        row={detailRow}
        isOpen={Boolean(cashCloseId)}
        onOpenChange={setDetailSheetOpen}
        unavailable={
          cashCloseId && !detailRow
            ? {
                message: isHistoryLoading
                  ? "Cargando detalle…"
                  : hasHistoryError
                    ? "No pudimos cargar el detalle."
                    : "No encontramos este detalle en el historial.",
                onRetry: hasHistoryError ? retryHistory : undefined,
                isRetrying: isHistoryFetching,
              }
            : undefined
        }
      />
    </main>
  );
}
