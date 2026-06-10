import { PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BatchItem } from "../columns";
import { ModalFooterActionRow, ModalShortcutActionButton } from "@/components/modals/shared/modal-ui";

const NEW_ITEM_KIND = "new";
const EXISTING_ITEM_KIND = "existing";

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
  const newItemsCount = pendingBatchItems.filter((item) => item.kind === NEW_ITEM_KIND).length;
  const existingItemsCount = pendingBatchItems.filter((item) => item.kind === EXISTING_ITEM_KIND).length;
  const hasNoItems = pendingBatchItems.length === 0;

  return (
    <footer className="flex w-full flex-col gap-2">
      <ModalFooterActionRow
        message={
          hasNoItems ? (
            <span className="tabular-nums">Sin items pendientes</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              {newItemsCount > 0 && (
                <Badge variant="outline" className="px-1.5 py-0.5 text-[10px]">
                  {newItemsCount} nuevo{newItemsCount > 1 ? "s" : ""}
                </Badge>
              )}
              {existingItemsCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">
                  {existingItemsCount} existente{existingItemsCount > 1 ? "s" : ""}
                </Badge>
              )}
              <span className="hidden sm:inline">en el lote</span>
            </span>
          )
        }
      >
        <ModalShortcutActionButton
          icon={<PackagePlus data-icon="inline-start" className="h-4 w-4" />}
          label={
            isSubmissionPending
              ? "Procesando..."
              : `Cargar ${!hasNoItems ? pendingBatchItems.length : ""} producto${pendingBatchItems.length !== 1 ? "s" : ""}`
          }
          disabled={hasNoItems || isSubmissionPending}
          onClick={onOpenConfirmDialog}
          className="max-md:w-full"
        />
      </ModalFooterActionRow>
    </footer>
  );
}
