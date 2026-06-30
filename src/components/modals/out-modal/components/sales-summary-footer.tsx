import { ShoppingCart } from "lucide-react";
import type { PendingSale } from "../types";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

type SalesSummaryFooterProps = {
  pendingSales: PendingSale[];
  exchangeRate: ModalExchangeRate;
  isSubmissionPending: boolean;
  onOpenConfirmDialog: () => void;
};

export function SalesSummaryFooter({
  pendingSales,
  exchangeRate,
  isSubmissionPending,
  onOpenConfirmDialog,
}: SalesSummaryFooterProps) {
  const pendingSalesCount = pendingSales.length;
  const hasPendingSales = pendingSalesCount > 0;
  const isMultipleSales = pendingSalesCount > 1;
  const canSubmit = hasPendingSales && !isSubmissionPending && exchangeRate.isReady;

  return (
    <footer className="flex w-full flex-col gap-3">
      {!exchangeRate.isReady && (
        <section className="border-warning/40 bg-warning/8 rounded-md border px-3 py-2 text-xs">
          <p className="text-warning-foreground font-medium">{exchangeRate.statusTitle}</p>
          <p className="text-muted-foreground mt-1">{exchangeRate.statusMessage}</p>
        </section>
      )}

      <ModalFooterActionRow
        message={
          <span className="tabular-nums">
            {!hasPendingSales
              ? "Sin ventas pendientes"
              : `${isMultipleSales ? "Ventas listas" : "Venta lista"} para confirmar`}
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
