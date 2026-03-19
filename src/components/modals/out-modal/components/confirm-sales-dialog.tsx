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

interface ConfirmSalesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onConfirmSubmit: () => void;
}

export function ConfirmSalesDialog({
  isOpen,
  onOpenChange,
  pendingSales,
  currentExchangeRate,
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
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tasa</span>
          <span className="font-medium tabular-nums">{formatCurrencyVES(currentExchangeRate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total lote USD</span>
          <span className="text-foreground font-bold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</span>
        </div>
        <div className="border-primary/20 flex justify-between border-t pt-1">
          <span className="text-muted-foreground">Total lote Bs</span>
          <span className="text-foreground font-bold tabular-nums">{formatCurrencyVES(totalAmountVes)}</span>
        </div>
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
