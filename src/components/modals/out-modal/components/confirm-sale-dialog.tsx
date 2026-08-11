import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { TableHead } from "@/components/ui/table";
import type { PendingSaleLine } from "../types";
import { MODAL_SUBMISSION_ERROR_MESSAGES } from "@/components/modals/shared/submission-messages";
import {
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
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmSaleDialogProps) {
  const lineCount = pendingSaleLines.length;
  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Confirmar venta"
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
      submissionErrorMessage={MODAL_SUBMISSION_ERROR_MESSAGES.sale}
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady}
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-48">
        <table className="w-full">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-muted/35 text-muted-foreground border-b">
              <TableHead scope="col" className="py-1.5">
                Producto
              </TableHead>
              <TableHead scope="col" className="py-1.5 text-right">
                Cant.
              </TableHead>
              <TableHead scope="col" className="py-1.5 text-right">
                Importe USD
              </TableHead>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pendingSaleLines.map((saleLine) => (
              <tr
                key={saleLine.tempId}
                className="bg-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-2 sm:table-row sm:px-0 sm:py-0"
              >
                <td className="col-span-2 min-w-0 p-0 align-middle sm:table-cell sm:px-3 sm:py-2">
                  <ModalProductIdentity code={saleLine.code} description={saleLine.description} />
                </td>
                <td className="flex items-baseline justify-between gap-2 p-0 align-middle sm:table-cell sm:px-3 sm:py-2 sm:text-right">
                  <span className="text-muted-foreground text-[11px] font-medium sm:hidden">Cant.</span>
                  <span className="font-semibold tabular-nums">{saleLine.quantity}</span>
                </td>
                <td className="p-0 text-right align-middle whitespace-nowrap sm:table-cell sm:px-3 sm:py-2">
                  <span className="text-muted-foreground mr-1.5 text-[11px] font-medium sm:hidden">Importe USD</span>
                  <span className="font-semibold tabular-nums">{formatCurrencyUSD(saleLine.totalUsd)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>

      <ConfirmDialogSummarySection className="border-primary/20 bg-primary/5 gap-0 overflow-hidden p-0">
        {!exchangeRate.isReady && <p className="text-warning px-3 py-2">{exchangeRate.statusMessage}</p>}

        <div className="grid grid-cols-2 divide-x">
          <div className="min-w-0 p-3">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase">Total USD</p>
            <p className="mt-1 text-base leading-tight font-bold whitespace-nowrap tabular-nums sm:text-lg">
              {formatCurrencyUSD(totalAmountUsd)}
            </p>
          </div>
          <div className="min-w-0 p-3 text-right">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase">Total Bs.</p>
            <p className="mt-1 text-base leading-tight font-bold whitespace-nowrap tabular-nums sm:text-lg">
              {exchangeRate.isReady ? formatCurrencyVES(totalAmountVes) : "—"}
            </p>
          </div>
        </div>

        <div className="bg-card/85 border-primary/15 flex items-center justify-between gap-3 border-t px-3 py-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase">Tasa aplicada</p>
          <p className="font-medium whitespace-nowrap tabular-nums">{exchangeRate.displayValue}</p>
        </div>
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
