import type { ReactNode } from "react";
import { Check, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CashCloseWithRelations } from "@/types";
import { formatCurrencyUSD, formatCurrencyVES, formatDate, formatTime } from "@/utils/formatters";
import { formatLedgerAmount, type CashCloseDayState, type CashCloseFigures } from "../cash-close-ledger";
import { CashCloseLedgerTable } from "./cash-close-ledger-table";

export type DayCloseState =
  | CashCloseDayState<CashCloseWithRelations>
  | { kind: "unverified"; reason: "close" | "summary"; retry: () => void; isRetrying: boolean };

type DayClosePanelProps = {
  date: string;
  /** El día que se cuadra: «Hoy · 17 nov. 2026» o la fecha filtrada. */
  title: string;
  figures: CashCloseFigures;
  state: DayCloseState;
  onRequestClose: () => void;
  isPending: boolean;
  canClose: boolean;
};

const PANEL_GRID_CLASS_NAME =
  "bg-card grid min-w-0 shrink-0 grid-cols-1 border-b @min-[58rem]/cash-close:grid-cols-[minmax(0,1fr)_15rem]";
const RAIL_CLASS_NAME =
  "flex min-w-0 flex-col border-t @min-[58rem]/cash-close:border-t-0 @min-[58rem]/cash-close:border-l";
const RAIL_HEADER_CLASS_NAME =
  "bg-muted operational-label text-muted-foreground hidden h-10 shrink-0 items-center border-b px-4 @min-[58rem]/cash-close:flex";

/**
 * El cuadre del día a la izquierda y, a la derecha, si el día está cerrado y qué hacer. El botón queda a la altura del
 * Total producido: se cierra mirando la cifra que se cierra.
 */
export function DayClosePanel({
  date,
  title,
  figures,
  state,
  onRequestClose,
  isPending,
  canClose,
}: DayClosePanelProps) {
  return (
    <section aria-label={`Cuadre del día: ${title}`} className={PANEL_GRID_CLASS_NAME}>
      <CashCloseLedgerTable date={date} figures={figures} title={title} density="operational" />
      <DayCloseRail state={state} onRequestClose={onRequestClose} isPending={isPending} canClose={canClose} />
    </section>
  );
}

function closerName(cashClose: CashCloseWithRelations) {
  return cashClose.users?.fullname || "—";
}

function DayStateLabel({ state }: { state: DayCloseState }) {
  switch (state.kind) {
    case "open":
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-primary size-1.5 shrink-0 rounded-full" aria-hidden="true" />
          Sin cerrar
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3 shrink-0" aria-hidden="true" />
          Cerrado
        </span>
      );
    case "outdated":
      return (
        <span className="text-warning-foreground dark:text-warning inline-flex items-center gap-1.5">
          <span className="bg-warning size-1.5 shrink-0 rounded-full" aria-hidden="true" />
          Cambió tras el cierre
        </span>
      );
    case "unverified":
      return (
        <span className="text-warning-foreground dark:text-warning">
          {state.reason === "close" ? "Cierre sin verificar" : "Cuadre sin verificar"}
        </span>
      );
    case "unclosed":
      return state.hadSales ? (
        <span className="text-warning-foreground dark:text-warning inline-flex items-center gap-1.5">
          <span className="bg-warning size-1.5 shrink-0 rounded-full" aria-hidden="true" />
          Sin cierre
        </span>
      ) : (
        <span>Sin cierre</span>
      );
  }
}

const WARNING_TEXT_CLASS_NAME = "text-warning-foreground dark:text-warning font-medium";

function dayCount(count: number) {
  return count === 1 ? "1 día con ventas sin cerrar" : `${count} días con ventas sin cerrar`;
}

function lastCloseLabel(state: Extract<DayCloseState, { kind: "open" }>) {
  if (!state.lastClose) return undefined;
  if (state.isLastCloseYesterday) return "Último cierre: ayer";
  return `Último cierre: ${formatDate(`${state.lastClose.date}T12:00:00`)}`;
}

type RailContent = {
  /** Contexto arriba: de dónde viene el día. */
  context?: ReactNode;
  /** Información que acompaña al estado cuando no hay una acción disponible. */
  result?: ReactNode;
  actionLabel?: string;
  actionDetail?: ReactNode;
};

function getRailContent(state: DayCloseState): RailContent {
  switch (state.kind) {
    case "open":
      return {
        // Un día con ventas que quedó sin cerrar se dice con su cuenta; si no, basta con saber de cuándo es el último.
        context:
          state.skippedDays > 0 ? (
            <>
              <span className={WARNING_TEXT_CLASS_NAME}>{dayCount(state.skippedDays)}</span>
              {state.lastClose && <span className="block">{lastCloseLabel(state)}</span>}
            </>
          ) : (
            lastCloseLabel(state)
          ),
        actionLabel: "Cerrar el día",
      };
    case "outdated": {
      const { cashClose } = state;
      const closedAt = formatTime(cashClose.closed_at);
      const hasDelta = state.deltaUsd !== 0 || state.deltaVes !== 0;

      return {
        context: (
          <>
            <span className="block">
              Cierre guardado
              {closedAt && (
                <>
                  {" "}
                  · <span className="whitespace-nowrap">{closedAt}</span>
                </>
              )}
            </span>
            <span className="tabular-value text-foreground mt-0.5 flex flex-wrap justify-between gap-x-2">
              <span>{formatCurrencyUSD(cashClose.total_usd)}</span>
              <span className="whitespace-nowrap">{formatCurrencyVES(cashClose.total_ves)}</span>
            </span>
          </>
        ),
        actionDetail: hasDelta ? (
          <>
            Diferencia desde el cierre
            <span className="tabular-value text-foreground mt-0.5 flex flex-wrap justify-between gap-x-2 text-base font-bold">
              <span>{formatLedgerAmount(state.deltaUsd, formatCurrencyUSD, true)}</span>
              <span className="whitespace-nowrap">{formatLedgerAmount(state.deltaVes, formatCurrencyVES, true)}</span>
            </span>
          </>
        ) : (
          <span className={WARNING_TEXT_CLASS_NAME}>Cambió el cuadre con el mismo total.</span>
        ),
        actionLabel: "Actualizar cierre",
      };
    }
    case "unverified":
      return {
        context:
          state.reason === "close" ? "No pudimos consultar el cierre." : "Estas cifras pueden estar desactualizadas.",
      };
    case "closed":
      return {
        result: (
          <>
            <span className="text-foreground font-medium">{closerName(state.cashClose)}</span> ·{" "}
            <span className="tabular-value">{formatTime(state.cashClose.closed_at)}</span>
          </>
        ),
      };
    case "unclosed":
      return {
        result: state.hadSales ? (
          <span className={WARNING_TEXT_CLASS_NAME}>Tuvo ventas y no se cerró.</span>
        ) : (
          "Sin ventas ni cierre."
        ),
      };
  }
}

type DayCloseRailProps = Pick<DayClosePanelProps, "state" | "onRequestClose" | "isPending" | "canClose">;

function DayCloseRail({ state, onRequestClose, isPending, canClose }: DayCloseRailProps) {
  const { context, result, actionLabel, actionDetail } = getRailContent(state);

  return (
    <div className={RAIL_CLASS_NAME}>
      <div className={RAIL_HEADER_CLASS_NAME} role="status">
        <DayStateLabel state={state} />
      </div>

      <div className="flex flex-1 flex-col items-stretch justify-between gap-2.5 px-3 py-3 @min-[34rem]/cash-close:@max-[58rem]/cash-close:flex-row @min-[34rem]/cash-close:@max-[58rem]/cash-close:items-center @min-[58rem]/cash-close:px-4 @min-[58rem]/cash-close:pt-2 @min-[58rem]/cash-close:pb-1.5">
        <div className="text-muted-foreground flex min-w-0 flex-col gap-0.5 text-xs">
          <span className="text-foreground font-semibold @min-[58rem]/cash-close:hidden" role="status">
            <DayStateLabel state={state} />
          </span>
          {context && <p>{context}</p>}
          {actionDetail && <p className="mt-2 border-t pt-2">{actionDetail}</p>}
          {result && <p className="leading-relaxed break-words">{result}</p>}
        </div>

        {state.kind === "unverified" ? (
          <Button
            variant="outline"
            onClick={state.retry}
            disabled={state.isRetrying}
            className="shrink-0 @min-[58rem]/cash-close:w-full"
          >
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            {state.isRetrying ? "Reintentando…" : "Reintentar"}
          </Button>
        ) : actionLabel ? (
          <div className="flex flex-col gap-2 @min-[34rem]/cash-close:@max-[58rem]/cash-close:flex-row @min-[34rem]/cash-close:@max-[58rem]/cash-close:items-center">
            <Button onClick={onRequestClose} disabled={isPending || !canClose}>
              {state.kind === "open" && <Lock data-icon="inline-start" aria-hidden="true" />}
              {state.kind === "outdated" && <RefreshCw data-icon="inline-start" aria-hidden="true" />}
              {isPending ? (state.kind === "outdated" ? "Actualizando…" : "Cerrando…") : actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const SKELETON_LINE_WIDTHS = ["w-12", "w-16", "w-20", "w-14"];

/** Misma geometría que el panel cargado: nada salta cuando llegan las cifras. */
export function DayClosePanelSkeleton() {
  return (
    <div className={PANEL_GRID_CLASS_NAME} aria-hidden="true">
      <div className="flex min-w-0 flex-col">
        <div className="bg-muted flex h-10 items-center border-b px-3 @min-[58rem]/cash-close:px-4">
          <Skeleton className="h-2.5 w-28 rounded" />
        </div>
        {SKELETON_LINE_WIDTHS.map((width) => (
          <div
            key={width}
            className="border-border/40 flex h-[30px] items-center justify-between border-b px-3 @min-[58rem]/cash-close:px-4"
          >
            <Skeleton className={cn("h-3 rounded", width)} />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ))}
        <div className="border-foreground/40 flex h-10 items-center justify-between border-t px-3 @min-[58rem]/cash-close:px-4">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      </div>
      <div className={RAIL_CLASS_NAME}>
        <div className={RAIL_HEADER_CLASS_NAME}>
          <Skeleton className="h-2.5 w-20 rounded" />
        </div>
        <div className="flex flex-1 items-center justify-between px-3 py-2 @min-[58rem]/cash-close:flex-col @min-[58rem]/cash-close:items-stretch @min-[58rem]/cash-close:justify-end @min-[58rem]/cash-close:px-4 @min-[58rem]/cash-close:pt-2 @min-[58rem]/cash-close:pb-1.5">
          <Skeleton className="h-3 w-24 rounded @min-[58rem]/cash-close:hidden" />
          <Skeleton className="h-9 w-36 rounded-md @min-[58rem]/cash-close:w-full" />
        </div>
      </div>
    </div>
  );
}
