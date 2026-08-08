import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { TableHead } from "@/components/ui/table";
import type { PendingSaleLine } from "../types";
import {
  ConfirmDialogSummarySection,
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

type ConfirmSalesDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingSaleLines: PendingSaleLine[];
  exchangeRate: ModalExchangeRate;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
};

export function ConfirmSalesDialog({
  isOpen,
  onOpenChange,
  pendingSaleLines,
  exchangeRate,
  totalAmountUsd,
  totalAmountVes,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmSalesDialogProps) {
  const lineCount = pendingSaleLines.length;
  const lineLabel = lineCount === 1 ? "1 Renglón de venta" : `${lineCount} Renglones de venta`;
  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Confirmar venta"
      description={
        <>
          <strong className="text-foreground">{lineLabel}</strong>
          {" se asociará"}
          {lineCount === 1 ? "" : "n"} a una sola Venta. Verifica productos e importes.
        </>
      }
      confirmLabel="Registrar venta"
      pendingLabel="Registrando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady}
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-48">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/35 text-muted-foreground border-b">
              <TableHead className="py-1.5">Producto</TableHead>
              <TableHead className="py-1.5 text-right">Cant.</TableHead>
              <TableHead className="py-1.5 text-right">USD</TableHead>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pendingSaleLines.map((saleLine) => (
              <tr key={saleLine.tempId} className="bg-card">
                <td className="px-3 py-2 align-middle">
                  <ModalProductIdentity code={saleLine.code} description={saleLine.description} />
                </td>
                <td className="px-3 py-2 text-right align-middle font-semibold tabular-nums">{saleLine.quantity}</td>
                <td className="px-3 py-2 text-right align-middle font-semibold tabular-nums">
                  {formatCurrencyUSD(saleLine.totalUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>

      <ConfirmDialogSummarySection className="border-primary/20 bg-primary/5 gap-0 overflow-hidden p-0">
        {!exchangeRate.isReady && <p className="text-warning mb-1">{exchangeRate.statusMessage}</p>}

        <div className="grid grid-cols-2 divide-x">
          <div className="min-w-0 p-3">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase">Total USD</p>
            <p className="mt-1 text-lg leading-tight font-bold whitespace-nowrap tabular-nums">
              {formatCurrencyUSD(totalAmountUsd)}
            </p>
          </div>
          <div className="min-w-0 p-3 text-right">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase">Total Bs.</p>
            <p className="mt-1 text-lg leading-tight font-bold whitespace-nowrap tabular-nums">
              {exchangeRate.isReady ? formatCurrencyVES(totalAmountVes) : "—"}
            </p>
          </div>
        </div>

        <div className="bg-card/85 border-primary/15 flex items-center justify-between gap-3 border-t px-3 py-2">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase">Tasa aplicada</p>
          <p className="font-medium whitespace-nowrap tabular-nums">{exchangeRate.displayValue}</p>
        </div>
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
