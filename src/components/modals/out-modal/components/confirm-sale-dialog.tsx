import { useState } from "react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { TableHead } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { PendingSaleLine } from "../types";
import type { CasheaOrderInput } from "@/types";
import { getSaleSubmissionErrorMessage } from "@/components/modals/shared/submission-messages";
import {
  ConfirmDialogLineRow,
  ConfirmDialogLineTable,
  ConfirmDialogSummarySection,
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

type ConfirmSaleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingSaleLines: PendingSaleLine[];
  exchangeRate: ModalExchangeRate;
  totalAmountUsd: number;
  totalAmountVes: number;
  /** Orden Cashea validada; `null` o ausente en una venta sin Cashea. */
  casheaOrder?: CasheaOrderInput | null;
  /** El total de la orden difiere del total de la venta: el cajero debe confirmarlo antes de registrar. */
  casheaSaleTotalMismatch?: boolean;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void | Promise<void>;
};

export function ConfirmSaleDialog({
  isOpen,
  onOpenChange,
  pendingSaleLines,
  exchangeRate,
  totalAmountUsd,
  totalAmountVes,
  casheaOrder = null,
  casheaSaleTotalMismatch = false,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmSaleDialogProps) {
  const lineCount = pendingSaleLines.length;

  // La confirmación del total distinto se pide de nuevo cada vez que se abre el diálogo.
  const [isOrderTotalConfirmed, setIsOrderTotalConfirmed] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) setIsOrderTotalConfirmed(false);
  }

  const requiresOrderTotalConfirmation = casheaOrder !== null && casheaSaleTotalMismatch;
  const isOrderTotalPending = requiresOrderTotalConfirmation && !isOrderTotalConfirmed;

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={casheaOrder ? "Confirmar Venta Cashea" : "Confirmar venta"}
      description={
        <>
          Se registrará{lineCount === 1 ? "" : "n"}{" "}
          <strong className="text-foreground">
            {lineCount} {lineCount === 1 ? "renglón" : "renglones"} de venta
          </strong>
          . Verifica productos e importes.
        </>
      }
      confirmLabel="Registrar venta"
      pendingLabel="Registrando..."
      submissionErrorMessage={getSaleSubmissionErrorMessage}
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady || isOrderTotalPending}
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-48">
        <ConfirmDialogLineTable
          header={
            <>
              <TableHead scope="col">Producto</TableHead>
              <TableHead scope="col" className="text-right">
                Cantidad
              </TableHead>
              <TableHead scope="col" className="text-right">
                Importe USD
              </TableHead>
            </>
          }
        >
          {pendingSaleLines.map((saleLine) => (
            <ConfirmDialogLineRow key={saleLine.tempId}>
              <td className="col-span-2 min-w-0 p-0 align-middle sm:table-cell">
                <ModalProductIdentity code={saleLine.code} description={saleLine.description} />
              </td>
              <td className="flex items-baseline justify-between gap-2 p-0 align-middle sm:table-cell sm:text-right">
                <span className="text-muted-foreground text-[11px] font-medium sm:hidden">Cantidad</span>
                <span className="tabular-value font-semibold">{saleLine.quantity}</span>
              </td>
              <td className="p-0 text-right align-middle whitespace-nowrap sm:table-cell">
                <span className="text-muted-foreground mr-1.5 text-[11px] font-medium sm:hidden">Importe USD</span>
                <span className="data-value font-semibold">{formatCurrencyUSD(saleLine.totalUsd)}</span>
              </td>
            </ConfirmDialogLineRow>
          ))}
        </ConfirmDialogLineTable>
      </ConfirmDialogTableSection>

      <ConfirmDialogSummarySection className="border-primary/20 bg-primary/5 gap-0 overflow-hidden p-0">
        {!exchangeRate.isReady && <p className="text-warning px-3 py-2">{exchangeRate.statusMessage}</p>}

        <div className="grid grid-cols-2 divide-x">
          <div className="min-w-0 p-3">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase">Total USD</p>
            <p className="data-value mt-1 text-base leading-tight font-bold whitespace-nowrap sm:text-lg">
              {formatCurrencyUSD(totalAmountUsd)}
            </p>
          </div>
          <div className="min-w-0 p-3 text-right">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase">Total Bs.</p>
            <p className="data-value mt-1 text-base leading-tight font-bold whitespace-nowrap sm:text-lg">
              {exchangeRate.isReady ? formatCurrencyVES(totalAmountVes) : "—"}
            </p>
          </div>
        </div>

        <div className="bg-card/85 border-primary/15 flex items-center justify-between gap-3 border-t px-3 py-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase">Tasa aplicada</p>
          <p className="data-value font-medium whitespace-nowrap">{exchangeRate.displayValue}</p>
        </div>
      </ConfirmDialogSummarySection>

      {casheaOrder && (
        <ConfirmDialogSummarySection className="gap-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b px-3 py-2">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase">Pago con Cashea</p>
            <p className="text-muted-foreground text-xs">
              Orden <span className="data-value text-foreground font-semibold">{casheaOrder.order_number}</span> ·
              Factura <span className="data-value text-foreground font-semibold">{casheaOrder.invoice_number}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x">
            <div className="min-w-0 p-3">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase">Entra a caja hoy</p>
              <p className="data-value mt-1 text-base leading-tight font-bold whitespace-nowrap">
                {formatCurrencyUSD(casheaOrder.paid_today_usd)}
              </p>
            </div>
            <div className="min-w-0 p-3 text-right">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase">Por cobrar a Cashea</p>
              <p className="data-value mt-1 text-base leading-tight font-bold whitespace-nowrap">
                {formatCurrencyUSD(casheaOrder.financed_usd)}
              </p>
            </div>
          </div>
        </ConfirmDialogSummarySection>
      )}

      {casheaOrder && casheaSaleTotalMismatch && (
        <section className="border-warning/40 bg-warning/8 flex flex-col gap-2 rounded-md border px-3 py-2 text-xs">
          <p className="text-warning-foreground font-medium">
            El total de la orden Cashea ({formatCurrencyUSD(casheaOrder.total_usd)}) difiere del total de la venta (
            {formatCurrencyUSD(totalAmountUsd)}).
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cashea-order-total-confirmation"
              checked={isOrderTotalConfirmed}
              onCheckedChange={(checked) => setIsOrderTotalConfirmed(checked === true)}
            />
            <Label htmlFor="cashea-order-total-confirmation" className="text-xs font-medium">
              Confirmo el total de la orden Cashea
            </Label>
          </div>
        </section>
      )}
    </ModalConfirmDialog>
  );
}
