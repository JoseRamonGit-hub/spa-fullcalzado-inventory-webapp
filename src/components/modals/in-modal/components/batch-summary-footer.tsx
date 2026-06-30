import { PackagePlus } from "lucide-react";
import type { BatchItem } from "../types";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";

type BatchSummaryFooterProps = {
  pendingBatchItems: BatchItem[];
  isSubmissionPending: boolean;
  onOpenConfirmDialog: () => void;
};

export function BatchSummaryFooter({
  pendingBatchItems,
  isSubmissionPending,
  onOpenConfirmDialog,
}: BatchSummaryFooterProps) {
  const hasNoItems = pendingBatchItems.length === 0;

  return (
    <footer className="flex w-full flex-col gap-2">
      <ModalFooterActionRow
        message={
          hasNoItems ? (
            <span className="tabular-nums">Sin productos en el lote</span>
          ) : (
            <span className="text-foreground font-semibold">Lote listo para confirmar</span>
          )
        }
      >
        <ModalShortcutActionButton
          icon={<PackagePlus data-icon="inline-start" />}
          label={
            isSubmissionPending
              ? "Procesando..."
              : `Cargar ${!hasNoItems ? pendingBatchItems.length : ""} producto${pendingBatchItems.length !== 1 ? "s" : ""}`
          }
          disabled={hasNoItems || isSubmissionPending}
          onClick={onOpenConfirmDialog}
        />
      </ModalFooterActionRow>
    </footer>
  );
}
