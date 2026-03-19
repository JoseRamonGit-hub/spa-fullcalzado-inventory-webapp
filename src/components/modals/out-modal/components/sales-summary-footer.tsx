import { ShoppingCart } from "lucide-react";
import { SalesSummaryBlock } from "./sales-summary-block";
import type { PendingSale } from "../types";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";

interface SalesSummaryFooterProps {
  pendingSales: PendingSale[];
  currentExchangeRate: number;
  totalAmountUsd: number;
  totalAmountVes: number;
  isSubmissionPending: boolean;
  onOpenConfirmDialog: () => void;
}

export function SalesSummaryFooter({
  pendingSales,
  currentExchangeRate,
  totalAmountUsd,
  totalAmountVes,
  isSubmissionPending,
  onOpenConfirmDialog,
}: SalesSummaryFooterProps) {
  const pendingSalesCount = pendingSales.length;
  const hasPendingSales = pendingSalesCount > 0;
  const isMultipleSales = pendingSalesCount > 1;

  return (
    <footer className="flex w-full flex-col gap-3">
      <SalesSummaryBlock
        currentExchangeRate={currentExchangeRate}
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
          disabled={!hasPendingSales || isSubmissionPending}
          onClick={onOpenConfirmDialog}
        />
      </ModalFooterActionRow>
    </footer>
  );
}
