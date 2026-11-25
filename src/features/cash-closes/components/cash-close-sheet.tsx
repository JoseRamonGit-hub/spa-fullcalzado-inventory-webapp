import type { ReactNode } from "react";
import { ActivityTimeline } from "@/components/ui/activity-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  formatCalendarDateString,
  formatCurrencyUSD,
  formatCurrencyVES,
  formatDateForBackend,
  formatDateTime,
  formatInteger,
  formatTime,
} from "@/utils/formatters";
import type { CashCloseHistoryRow } from "../cash-close-ledger";
import { CashCloseLedgerTable } from "./cash-close-ledger-table";
import { CasheaStatusIndicator } from "./cashea-status-indicator";

type CashCloseSheetProps = {
  row: CashCloseHistoryRow | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  unavailable?: { message: string; onRetry?: () => void; isRetrying: boolean };
};

/** El detalle de una fila del historial: un cierre, o un día con ventas que nadie cerró. */
export function CashCloseSheet({ row, isOpen, onOpenChange, unavailable }: CashCloseSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="@container w-full gap-0 motion-reduce:animate-none max-sm:border-l-0 sm:max-w-[32rem]">
        {row ? (
          <CashCloseDetail row={row} />
        ) : (
          <SheetHeader className="border-b px-4 py-4 pe-12 @sm:ps-6">
            <SheetTitle>Cierre de caja</SheetTitle>
            <SheetDescription role="status">{unavailable?.message}</SheetDescription>
          </SheetHeader>
        )}
        {!row && unavailable?.onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mx-4 mt-4 self-start @sm:mx-6"
            onClick={unavailable.onRetry}
            disabled={unavailable.isRetrying}
          >
            Reintentar
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-border flex min-h-8 items-center justify-between gap-3 border-b px-4 text-xs @sm:px-6">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="data-value min-w-0 text-right font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function CashCloseDetail({ row }: { row: CashCloseHistoryRow }) {
  const { figures } = row;
  const dateLabel = formatCalendarDateString(row.date);
  const cashClose = row.kind === "closed" ? row.cashClose : undefined;
  const closedAt = cashClose?.closed_at ?? undefined;
  const versions = cashClose ? [cashClose, ...[...(cashClose.cash_close_previous_versions ?? [])].reverse()] : [];

  return (
    <>
      <SheetHeader className="border-b px-4 py-4 pe-12 @sm:ps-6">
        <div className="flex min-w-0 flex-col gap-1">
          <SheetTitle className="font-heading text-base leading-tight font-bold tracking-tight @sm:text-lg">
            <time dateTime={row.date}>{dateLabel}</time>
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <SheetDescription className="text-xs">{cashClose ? "Cierre de caja" : "Caja del día"}</SheetDescription>
            {!cashClose && <Badge variant="warning">Sin cierre</Badge>}
          </div>
        </div>
      </SheetHeader>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* El contenedor de la tabla ocupa el alto de su padre: envuelto, mide lo que mide la cuenta. */}
        <div>
          <CashCloseLedgerTable
            key={row.id}
            date={row.date}
            closedAt={closedAt}
            figures={figures}
            title="Cuadre"
            density="compact"
            hasExactOperationCount={row.kind !== "closed" || row.cashClose.total_billed_operations != null}
          />
        </div>

        <h3 className="bg-muted operational-label text-muted-foreground mt-4 flex h-8 items-center border-y px-4 @sm:px-6">
          Resumen del día
        </h3>
        <dl className="grid @min-[22rem]:grid-cols-2 @min-[22rem]:[&>div+div]:border-s">
          <DetailRow
            label={
              cashClose && cashClose.total_billed_operations == null ? "Renglones facturados" : "Operaciones facturadas"
            }
          >
            {formatInteger(
              cashClose && cashClose.total_billed_operations == null
                ? cashClose.total_transactions
                : figures.billedOperations,
            )}
          </DetailRow>
          <DetailRow label="Unidades">{formatInteger(figures.units)}</DetailRow>
        </dl>
        <dl>
          <DetailRow label="Total facturado">
            <span className="flex flex-wrap justify-end gap-x-4 text-xs font-normal">
              <span className="whitespace-nowrap">{formatCurrencyUSD(figures.billed.usd)}</span>
              <span className="text-muted-foreground whitespace-nowrap">{formatCurrencyVES(figures.billed.ves)}</span>
            </span>
          </DetailRow>
          {row.cashea && row.cashea.orders_count > 0 && (
            <DetailRow label="Cobro Cashea actual">
              <CasheaStatusIndicator status={row.cashea} />
            </DetailRow>
          )}
          {cashClose && (
            <DetailRow label="Tasa del cierre">{formatCurrencyVES(cashClose.exchange_rate)} por USD</DetailRow>
          )}
        </dl>

        {cashClose && (
          <div className="px-4 @sm:px-6">
            <ActivityTimeline
              title="Actividad del cierre"
              events={versions.map((version, index) => ({
                id: `${index === 0 ? "current" : "previous"}-${version.id}`,
                label: (
                  <>
                    <span>{index === versions.length - 1 ? "Cerrado" : "Actualizado"}</span>{" "}
                    <span className="text-muted-foreground font-normal">
                      {version.users?.fullname || "Responsable sin registrar"}
                    </span>
                  </>
                ),
                metadata: version.closed_at && (
                  <time dateTime={version.closed_at}>
                    {formatDateForBackend(version.closed_at) === row.date
                      ? formatTime(version.closed_at)
                      : formatDateTime(version.closed_at)}
                  </time>
                ),
              }))}
            />
          </div>
        )}
      </div>
    </>
  );
}
