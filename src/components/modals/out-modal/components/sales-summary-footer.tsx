import { ShoppingCart } from "lucide-react";
import { SalesSummaryBlock } from "./sales-summary-block";
import type { PendingSale } from "../types";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";

type SalesSummaryFooterProps = {
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  isExchangeRateLoading: boolean;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onOpenConfirmDialog: () => void;
};

export function SalesSummaryFooter({
  pendingSales,
  currentExchangeRate,
  isExchangeRateLoading,
  totalAmountUsd,
  totalAmountVes,
  isSubmissionPending,
  onOpenConfirmDialog,
}: SalesSummaryFooterProps) {
  const pendingSalesCount = pendingSales.length;
  const hasPendingSales = pendingSalesCount > 0;
  const isMultipleSales = pendingSalesCount > 1;
  const isExchangeRateReady = currentExchangeRate > 0;
  const exchangeRateTitle = isExchangeRateLoading ? "Cargando tasa" : "Tasa no disponible";
  const exchangeRateMessage = isExchangeRateLoading
    ? "Cargando tasa de cambio vigente..."
    : "No hay una tasa de cambio vigente. Actualizala en Ajustes para continuar.";
  const canSubmit = hasPendingSales && !isSubmissionPending && isExchangeRateReady;

  return (
    <footer className="flex w-full flex-col gap-3">
      {!isExchangeRateReady && (
        <section className="border-warning/40 bg-warning/8 rounded-md border px-3 py-2 text-xs">
          <p className="text-warning-foreground font-medium">{exchangeRateTitle}</p>
          <p className="text-muted-foreground mt-1">{exchangeRateMessage}</p>
        </section>
      )}

      <SalesSummaryBlock
        currentExchangeRate={currentExchangeRate}
        isExchangeRateLoading={isExchangeRateLoading}
        totalAmountUsd={totalAmountUsd}
        totalAmountVes={totalAmountVes}
      />

      <ModalFooterActionRow
        message={
          <span className="tabular-nums">
            {!hasPendingSales
              ? "Sin ventas pendientes"
              : `${pendingSalesCount} venta${isMultipleSales ? "s" : ""} en cola`}
          </span>
        }
      >
        <ModalShortcutActionButton
          icon={<ShoppingCart data-icon="inline-start" />}
          label={
            isSubmissionPending
              ? "Registrando..."
              : hasPendingSales
                ? `Registrar ${pendingSalesCount} venta${isMultipleSales ? "s" : ""}`
                : "Registrar ventas"
          }
          disabled={!canSubmit}
          onClick={onOpenConfirmDialog}
        />
      </ModalFooterActionRow>
    </footer>
  );
}
