import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import type { BatchItem } from "../columns";

const NEW_ITEM_KIND = "new";
const EXISTING_ITEM_KIND = "existing";

interface BatchSummaryFooterProps {
  pendingBatchItems: BatchItem[];
  isSubmissionPending: boolean;
  onOpenConfirmDialog: () => void;
}

export function BatchSummaryFooter({
  pendingBatchItems,
  isSubmissionPending,
  onOpenConfirmDialog,
}: BatchSummaryFooterProps) {
  const newItemsCount = pendingBatchItems.filter((item) => item._kind === NEW_ITEM_KIND).length;
  const existingItemsCount = pendingBatchItems.filter((item) => item._kind === EXISTING_ITEM_KIND).length;
  const hasNoItems = pendingBatchItems.length === 0;

  return (
    <footer className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
      <p className="text-muted-foreground text-xs tabular-nums">
        {hasNoItems ? (
          "Sin items pendientes"
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
        )}
      </p>

      <Button
        type="button"
        className="w-full shrink-0 gap-3 md:w-auto"
        disabled={hasNoItems || isSubmissionPending}
        onClick={onOpenConfirmDialog}
      >
        <PackagePlus data-icon="inline-start" className="h-4 w-4" />
        <span className="truncate">
          {isSubmissionPending
            ? "Procesando..."
            : `Cargar ${!hasNoItems ? pendingBatchItems.length : ""} item${pendingBatchItems.length !== 1 ? "s" : ""}`}
        </span>
        <KbdGroup className="hidden opacity-60 md:flex" aria-hidden="true">
          <Kbd>Shift ⇧</Kbd>
          <span>+</span>
          <Kbd>Enter</Kbd>
        </KbdGroup>
      </Button>
    </footer>
  );
}
