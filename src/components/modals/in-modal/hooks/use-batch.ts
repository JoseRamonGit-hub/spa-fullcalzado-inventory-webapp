import type { BatchItem } from "../types";
import { usePendingItems } from "@/components/modals/shared/use-pending-items";

export interface UseBatchReturn {
  pendingBatchItems: BatchItem[];
  addPendingBatchItem: (item: BatchItem) => void;
  removePendingBatchItem: (tempId: string) => void;
  clearPendingBatchItems: () => void;
}

export function useBatch(): UseBatchReturn {
  const { items: pendingBatchItems, addItem, removeItem, clearItems } = usePendingItems<BatchItem>();

  return {
    pendingBatchItems,
    addPendingBatchItem: addItem,
    removePendingBatchItem: removeItem,
    clearPendingBatchItems: clearItems,
  };
}
