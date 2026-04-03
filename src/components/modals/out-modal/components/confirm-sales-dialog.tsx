import { ShoppingCart } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../types";
import {
  ConfirmDialogSummarySection,
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import { getStripedRowClass } from "@/components/modals/shared/modal-table-utils";

type ConfirmSalesDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  isExchangeRateLoading: boolean;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
};

export function ConfirmSalesDialog({
  isOpen,
  onOpenChange,
  pendingSales,
  currentExchangeRate,
  isExchangeRateLoading,
  totalAmountUsd,
  totalAmountVes,
  isSubmissionPending,
  onConfirmSubmit,
}: ConfirmSalesDialogProps) {
  const pendingSalesCount = pendingSales.length;
  const isMultipleSales = pendingSalesCount > 1;
  const isExchangeRateReady = currentExchangeRate > 0;
  const exchangeRateDisplayValue = isExchangeRateReady ? formatCurrencyVES(currentExchangeRate) : "Sin tasa vigente";
  const exchangeRateMessage = isExchangeRateLoading
    ? "Cargando tasa de cambio vigente..."
    : "No hay una tasa de cambio vigente. Actualizala en Ajustes para continuar.";

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={<ShoppingCart className="text-primary" />}
      title="¿Confirmar registro de ventas?"
      description={
        <>
          Estás a punto de registrar{" "}
          <strong className="text-foreground">
            {pendingSalesCount} venta{isMultipleSales ? "s" : ""}
          </strong>
          . Esta acción no se puede deshacer.
        </>
      }
      confirmLabel="Confirmar ventas"
      pendingLabel="Registrando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!isExchangeRateReady}
    >
      <ConfirmDialogTableSection className="max-h-48">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground border-b">
              <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase">Producto</th>
              <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
              <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Total USD</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pendingSales.map((sale, index) => (
              <tr key={sale.tempId} className={getStripedRowClass(index)}>
                <td className="px-2.5 py-1">
                  <ModalProductIdentity code={sale.code} description={sale.description} />
                </td>
                <td className="px-2.5 py-1 text-right tabular-nums">{sale.quantity}</td>
                <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
                  {formatCurrencyUSD(sale.totalUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>

      <ConfirmDialogSummarySection>
        {!isExchangeRateReady && <p className="text-warning mb-1">{exchangeRateMessage}</p>}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tasa</span>
          <span className="font-medium tabular-nums">{exchangeRateDisplayValue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total lote USD</span>
          <span className="text-foreground font-bold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</span>
        </div>
        <div className="border-primary/20 flex justify-between border-t pt-1">
          <span className="text-muted-foreground">Total lote Bs</span>
          <span className="text-foreground font-bold tabular-nums">
            {isExchangeRateReady ? formatCurrencyVES(totalAmountVes) : "—"}
          </span>
        </div>
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
