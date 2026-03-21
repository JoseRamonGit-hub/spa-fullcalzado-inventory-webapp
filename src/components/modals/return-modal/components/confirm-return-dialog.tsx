import { IterationCcw } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingReturnItem, PendingExchangeItem } from "../types";
import {
  ConfirmDialogSummarySection,
  ConfirmDialogTableSection,
  ModalConfirmDialog,
  ModalProductIdentity,
} from "@/components/modals/shared/modal-ui";
import { getStripedRowClass } from "@/components/modals/shared/modal-table-utils";

interface ConfirmReturnDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  returnItems: readonly PendingReturnItem[];
  exchangeItems: readonly PendingExchangeItem[];
  returnType: "exchange" | "refund";
  creditUsd: number;
  differenceUsd: number;
  differenceVes: number;
  currentExchangeRate: number;
  isExchangeRateLoading: boolean;
  isSubmissionPending: boolean;
  notes: string;
  onConfirmSubmit: () => void;
}

export function ConfirmReturnDialog({
  isOpen,
  onOpenChange,
  returnItems,
  exchangeItems,
  returnType,
  creditUsd,
  differenceUsd,
  differenceVes,
  currentExchangeRate,
  isExchangeRateLoading,
  isSubmissionPending,
  notes,
  onConfirmSubmit,
}: ConfirmReturnDialogProps) {
  const isExchange = returnType === "exchange";
  const isExchangeRateReady = currentExchangeRate > 0;
  const exchangeRateDisplayValue = isExchangeRateReady ? formatCurrencyVES(currentExchangeRate) : "Sin tasa vigente";
  const exchangeRateMessage = isExchangeRateLoading
    ? "Cargando tasa de cambio vigente..."
    : "No hay una tasa de cambio vigente. Actualizala en Ajustes para continuar.";

  return (
    <ModalConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={<IterationCcw className="text-warning" />}
      title={isExchange ? "¿Confirmar cambio?" : "¿Confirmar devolución?"}
      description={
        isExchange
          ? "El cliente devuelve producto(s) y se lleva producto(s) nuevo(s). Esta acción no se puede deshacer."
          : "Se registrará una devolución pura. El crédito se devuelve al cliente. Esta acción no se puede deshacer."
      }
      confirmLabel={isExchange ? "Confirmar cambio" : "Confirmar devolución"}
      pendingLabel="Registrando..."
      isSubmissionPending={isSubmissionPending}
      onConfirmSubmit={onConfirmSubmit}
      confirmDisabled={!isExchangeRateReady}
    >
      <ConfirmDialogTableSection className="max-h-36">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground border-b">
              <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase" colSpan={2}>
                Productos devueltos
              </th>
              <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
              <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Crédito</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {returnItems.map((item, index) => (
              <tr key={item.tempId} className={getStripedRowClass(index)}>
                <td className="px-2.5 py-1" colSpan={2}>
                  <ModalProductIdentity code={item.code} description={item.description} />
                </td>
                <td className="px-2.5 py-1 text-right tabular-nums">{item.quantity}</td>
                <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
                  {formatCurrencyUSD(item.totalUsd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConfirmDialogTableSection>

      {isExchange && exchangeItems.length > 0 && (
        <ConfirmDialogTableSection className="max-h-36">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground border-b">
                <th className="px-2.5 py-1.5 text-left font-semibold tracking-wider uppercase" colSpan={2}>
                  Productos nuevos
                </th>
                <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Cant.</th>
                <th className="px-2.5 py-1.5 text-right font-semibold tracking-wider uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exchangeItems.map((item, index) => (
                <tr key={item.tempId} className={getStripedRowClass(index)}>
                  <td className="px-2.5 py-1" colSpan={2}>
                    <ModalProductIdentity code={item.code} description={item.description} />
                  </td>
                  <td className="px-2.5 py-1 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-2.5 py-1 text-right font-semibold tabular-nums">
                    {formatCurrencyUSD(item.totalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConfirmDialogTableSection>
      )}

      <ConfirmDialogSummarySection>
        {!isExchangeRateReady && <p className="text-warning mb-1">{exchangeRateMessage}</p>}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tasa</span>
          <span className="font-medium tabular-nums">{exchangeRateDisplayValue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Crédito</span>
          <span className="font-medium tabular-nums">{formatCurrencyUSD(creditUsd)}</span>
        </div>
        <div className="border-primary/20 flex justify-between border-t pt-1">
          <span className="text-muted-foreground font-semibold">
            {differenceUsd > 0 ? "Cliente paga" : differenceUsd < 0 ? "Tienda devuelve" : "Cambio exacto"}
          </span>
          <span
            className={`font-bold tabular-nums ${differenceUsd > 0 ? "text-success" : differenceUsd < 0 ? "text-destructive" : "text-foreground"}`}
          >
            {formatCurrencyUSD(Math.abs(differenceUsd))}
          </span>
        </div>
        {differenceUsd !== 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground" />
            <span className="text-muted-foreground tabular-nums">
              {isExchangeRateReady ? formatCurrencyVES(Math.abs(differenceVes)) : "—"}
            </span>
          </div>
        )}
        {notes && (
          <div className="border-border/50 border-t pt-1">
            <span className="text-muted-foreground">Motivo: </span>
            <span className="text-foreground">{notes}</span>
          </div>
        )}
      </ConfirmDialogSummarySection>
    </ModalConfirmDialog>
  );
}
