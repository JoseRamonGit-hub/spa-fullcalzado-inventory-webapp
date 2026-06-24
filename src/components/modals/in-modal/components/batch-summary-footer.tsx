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
  const hasOnlyNewItems = newItemsCount > 0 && existingItemsCount === 0;
  const hasOnlyExistingItems = existingItemsCount > 0 && newItemsCount === 0;
  const productLabel = pendingBatchItems.length === 1 ? "producto" : "productos";
  const newProductLabel = newItemsCount === 1 ? "producto nuevo" : "productos nuevos";
  const restockLabel = existingItemsCount === 1 ? "reposición" : "reposiciones";

  return (
    <footer className="flex w-full flex-col gap-2">
      <ModalFooterActionRow
        message={
          hasNoItems ? (
            <span className="tabular-nums">Sin productos en el lote</span>
          ) : hasOnlyNewItems ? (
            <span className="text-foreground font-semibold tabular-nums">
              {newItemsCount} {newProductLabel} en el lote
            </span>
          ) : hasOnlyExistingItems ? (
            <span className="text-foreground font-semibold tabular-nums">
              {existingItemsCount} {restockLabel} en el lote
            </span>
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-foreground font-semibold tabular-nums">
                {pendingBatchItems.length} {productLabel}
              </span>
              {newItemsCount > 0 && (
                <Badge variant="outline" className="px-1.5 py-0.5 text-[10px]">
                  {newItemsCount} nuevo{newItemsCount > 1 ? "s" : ""}
                </Badge>
              )}
              {existingItemsCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px]">
                  {existingItemsCount} {restockLabel}
                </Badge>
              )}
              <span className="hidden sm:inline">en el lote</span>
            </span>
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
