import { ShoppingCart } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../types";
import {
  ConfirmDialogSummarySection,
  ConfirmDialogTableSection,
  ModalConfirmDialog,
} from "@/components/modals/shared/modal-ui";

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
          Se registrarán{" "}
          <strong className="text-foreground">
            {pendingSalesCount} venta{isMultipleSales ? "s" : ""}
          </strong>
          . Revisa productos y totales antes de confirmar.
        </>
      }
      confirmLabel="Confirmar ventas"
      pendingLabel="Registrando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!isExchangeRateReady}
    >
      <ConfirmDialogTableSection className="bg-card border-border/80 max-h-48 shadow-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/35 text-muted-foreground border-b">
              <th className="px-3 py-2 text-left font-semibold tracking-wider uppercase">Producto</th>
              <th className="px-3 py-2 text-right font-semibold tracking-wider uppercase">Cant.</th>
              <th className="px-3 py-2 text-right font-semibold tracking-wider uppercase">Total USD</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {pendingSales.map((sale) => (
              <tr key={sale.tempId} className="bg-card">
                <td className="px-3 py-2.5 align-middle">
                  <span className="product-code block whitespace-nowrap uppercase">{sale.code}</span>
                  <span
                    className="text-muted-foreground mt-0.5 line-clamp-2 block wrap-break-word"
                    title={sale.description}
                  >
                    {sale.description}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right align-middle font-semibold tabular-nums">{sale.quantity}</td>
                <td className="px-3 py-2.5 text-right align-middle font-semibold tabular-nums">
                  {formatCurrencyUSD(sale.totalUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>

      <ConfirmDialogSummarySection className="border-primary/20 bg-primary/5 gap-0 overflow-hidden p-0">
        {!isExchangeRateReady && <p className="text-warning mb-1">{exchangeRateMessage}</p>}

        <div className="flex items-start justify-between gap-4 p-3">
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Total del lote</p>
            <p className="text-muted-foreground mt-1">Se cobrará al confirmar ventas</p>
          </div>
          <p className="text-right text-2xl leading-none font-bold tabular-nums">
            {isExchangeRateReady ? formatCurrencyVES(totalAmountVes) : "—"}
          </p>
        </div>

        <div className="bg-card/85 border-primary/15 grid grid-cols-2 gap-3 border-t px-3 py-2.5">
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">USD</p>
            <p className="mt-0.5 font-semibold tabular-nums">{formatCurrencyUSD(totalAmountUsd)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">Tasa</p>
            <p className="mt-0.5 font-medium tabular-nums">{exchangeRateDisplayValue}</p>
          </div>
        </div>
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
