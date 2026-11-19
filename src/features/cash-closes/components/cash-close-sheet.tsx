import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCurrencyUSD, formatCurrencyVES, formatDate, formatInteger, formatTime } from "@/utils/formatters";
import type { CashCloseHistoryRow } from "../cash-close-ledger";
import { CashCloseLedgerTable } from "./cash-close-ledger-table";
import { CasheaStatusIndicator } from "./cashea-status-indicator";

type CashCloseSheetProps = {
  row: CashCloseHistoryRow | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/** El detalle de una fila del historial: un cierre, o un día con ventas que nadie cerró. */
export function CashCloseSheet({ row, isOpen, onOpenChange }: CashCloseSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-[32rem]">{row && <CashCloseDetail row={row} />}</SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-border/40 flex min-h-8 items-center justify-between gap-3 border-b px-3 py-1.5 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="data-value text-right font-medium">{children}</dd>
    </div>
  );
}

function CashCloseDetail({ row }: { row: CashCloseHistoryRow }) {
  const navigate = useNavigate();
  const { figures } = row;
  const dateLabel = formatDate(`${row.date}T12:00:00`);
  const search = { date: row.date };

  return (
    <>
      <SheetHeader className="gap-0.5 border-b p-4 pe-12">
        {row.kind === "closed" ? (
          <>
            <SheetTitle className="text-sm">Cierre del {dateLabel}</SheetTitle>
            <SheetDescription className="text-xs">
              {row.cashClose.users?.fullname
                ? `Cerrado por ${row.cashClose.users.fullname}`
                : "Responsable sin registrar"}
              {row.cashClose.closed_at && (
                <>
                  {" "}
                  · <span className="tabular-value">{formatTime(row.cashClose.closed_at)}</span>
                </>
              )}
            </SheetDescription>
          </>
        ) : (
          <>
            <SheetTitle className="text-sm">{dateLabel}</SheetTitle>
            <SheetDescription className="text-warning-foreground dark:text-warning inline-flex items-center gap-1.5 text-xs font-medium">
              <span className="bg-warning size-1.5 shrink-0 rounded-full" aria-hidden="true" />
              Tuvo ventas y no se cerró
            </SheetDescription>
          </>
        )}
      </SheetHeader>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {/* El contenedor de la tabla ocupa el alto de su padre: envuelto, mide lo que mide la cuenta. */}
        <div>
          <CashCloseLedgerTable
            key={row.id}
            date={row.date}
            closedAt={row.kind === "closed" ? (row.cashClose.closed_at ?? undefined) : undefined}
            figures={figures}
            title="Cuadre"
            density="compact"
            hasExactOperationCount={row.kind !== "closed" || row.cashClose.total_billed_operations != null}
          />
        </div>

        <h3 className="bg-muted operational-label text-muted-foreground mt-4 flex h-7 items-center border-y px-3">
          Resumen del día
        </h3>
        <dl>
          <DetailRow label="Total facturado">
            <span className="flex flex-wrap justify-end gap-x-3">
              <span className="whitespace-nowrap">{formatCurrencyUSD(figures.billed.usd)}</span>
              <span className="text-muted-foreground whitespace-nowrap">{formatCurrencyVES(figures.billed.ves)}</span>
            </span>
          </DetailRow>
          {row.kind === "closed" && row.cashClose.total_billed_operations == null ? (
            <DetailRow label="Renglones facturados">{formatInteger(row.cashClose.total_transactions)}</DetailRow>
          ) : (
            <DetailRow label="Operaciones facturadas">{formatInteger(figures.billedOperations)}</DetailRow>
          )}
          <DetailRow label="Unidades">{formatInteger(figures.units)}</DetailRow>
          <DetailRow label="Cambios y devoluciones">{formatInteger(figures.returnsCount)}</DetailRow>
          <DetailRow label="Cobro Cashea actual">
            <CasheaStatusIndicator status={row.cashea} />
          </DetailRow>
          {row.kind === "closed" && (
            <DetailRow label="Tasa del cierre">{formatCurrencyVES(row.cashClose.exchange_rate)} por USD</DetailRow>
          )}
        </dl>
      </div>

      <SheetFooter className="bg-muted/60 shrink-0 flex-row flex-wrap items-center gap-1 border-t px-3 py-2">
        {figures.returnsCount > 0 && (
          <Button variant="ghost" className="px-2" onClick={() => navigate({ to: "/returns", search })}>
            Cambios y devoluciones
          </Button>
        )}
        <Button variant="outline" className="ms-auto" onClick={() => navigate({ to: "/transactions", search })}>
          Ver ventas
          <ArrowRight data-icon="inline-end" aria-hidden="true" className="max-[359px]:hidden" />
        </Button>
      </SheetFooter>
    </>
  );
}
