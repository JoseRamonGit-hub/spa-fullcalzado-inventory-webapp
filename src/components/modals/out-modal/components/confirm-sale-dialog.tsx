import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { TableHead } from "@/components/ui/table";
import type { PendingSaleLine } from "../types";
import { MODAL_SUBMISSION_ERROR_MESSAGES } from "@/components/modals/shared/submission-messages";
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
    </ModalConfirmDialog>
  );
}
