import { ShoppingCart } from "lucide-react";
import type { PendingSaleLine } from "../types";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";
import type { ModalExchangeRate } from "@/components/modals/shared/use-modal-exchange-rate";

type SalesSummaryFooterProps = {
  pendingSaleLines: PendingSaleLine[];
  exchangeRate: ModalExchangeRate;
  isSubmissionPending: boolean;
  onOpenConfirmDialog: () => void;
};

export function SalesSummaryFooter({
  pendingSaleLines,
  exchangeRate,
  isSubmissionPending,
  onOpenConfirmDialog,
}: SalesSummaryFooterProps) {
  const pendingSaleLineCount = pendingSaleLines.length;
  const hasPendingSaleLines = pendingSaleLineCount > 0;
  const canSubmit = hasPendingSaleLines && !isSubmissionPending && exchangeRate.isReady;
  const pendingProductLabel = `${pendingSaleLineCount} producto${pendingSaleLineCount === 1 ? "" : "s"} listo${
    pendingSaleLineCount === 1 ? "" : "s"
  } para confirmar`;

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
          <span className="tabular-nums">{hasPendingSaleLines ? pendingProductLabel : "Sin productos pendientes"}</span>
        }
      >
        <ModalShortcutActionButton
          icon={<ShoppingCart data-icon="inline-start" />}
          label={isSubmissionPending ? "Registrando..." : "Registrar venta"}
          disabled={!canSubmit}
          onClick={onOpenConfirmDialog}
        />
      </ModalFooterActionRow>
    </footer>
  );
}
