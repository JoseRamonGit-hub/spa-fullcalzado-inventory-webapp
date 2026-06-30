import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../types";
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
  pendingSales: PendingSale[];
  exchangeRate: ModalExchangeRate;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
};

export function ConfirmSalesDialog({
  isOpen,
  onOpenChange,
  pendingSales,
  exchangeRate,
  totalAmountUsd,
  totalAmountVes,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmSalesDialogProps) {
  const pendingSalesCount = pendingSales.length;
  const isMultipleSales = pendingSalesCount > 1;
  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Confirmar ventas"
      description={
        <>
          Se registrará{isMultipleSales ? "n" : ""}{" "}
          <strong className="text-foreground">
            {pendingSalesCount} venta{isMultipleSales ? "s" : ""}
          </strong>
          . Verifica productos e importes.
        </>
      }
      confirmLabel={`Registrar ${isMultipleSales ? "ventas" : "venta"}`}
      pendingLabel="Registrando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!exchangeRate.isReady}
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-48">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/35 text-muted-foreground border-b">
              <th className="px-3 py-1.5 text-left font-semibold tracking-wider uppercase">Producto</th>
              <th className="px-3 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
              <th className="px-3 py-1.5 text-right font-semibold tracking-wider uppercase">USD</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pendingSales.map((sale) => (
              <tr key={sale.tempId} className="bg-card">
                <td className="px-3 py-2 align-middle">
                  <ModalProductIdentity code={sale.code} description={sale.description} />
                </td>
                <td className="px-3 py-2 text-right align-middle font-semibold tabular-nums">{sale.quantity}</td>
                <td className="px-3 py-2 text-right align-middle font-semibold tabular-nums">
                  {formatCurrencyUSD(sale.totalUsd)}
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
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Total USD</p>
            <p className="mt-1 text-lg leading-tight font-bold whitespace-nowrap tabular-nums">
              {formatCurrencyUSD(totalAmountUsd)}
            </p>
          </div>
          <div className="min-w-0 p-3 text-right">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Total Bs.</p>
            <p className="mt-1 text-lg leading-tight font-bold whitespace-nowrap tabular-nums">
              {exchangeRate.isReady ? formatCurrencyVES(totalAmountVes) : "—"}
            </p>
          </div>
        </div>

        <div className="bg-card/85 border-primary/15 flex items-center justify-between gap-3 border-t px-3 py-2">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Tasa aplicada</p>
          <p className="font-medium whitespace-nowrap tabular-nums">{exchangeRate.displayValue}</p>
        </div>
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
