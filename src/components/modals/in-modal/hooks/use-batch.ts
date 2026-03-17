import { useState, useCallback } from "react";
import type { BatchItem } from "../columns";

export interface UseBatchReturn {
  pendingBatchItems: BatchItem[];
  addPendingBatchItem: (item: BatchItem) => void;
  removePendingBatchItem: (tempId: string) => void;
  clearPendingBatchItems: () => void;
}

export function useBatch(): UseBatchReturn {
  const [pendingBatchItems, setPendingBatchItems] = useState<BatchItem[]>([]);

  const addPendingBatchItem = useCallback((item: BatchItem) => {
    setPendingBatchItems((prevItems) => [...prevItems, item]);
  }, []);

  const removePendingBatchItem = useCallback((tempId: string) => {
    setPendingBatchItems((prevItems) => prevItems.filter((item) => item._tempId !== tempId));
  }, []);

  const clearPendingBatchItems = useCallback(() => {
    setPendingBatchItems([]);
  }, []);

  return { pendingBatchItems, addPendingBatchItem, removePendingBatchItem, clearPendingBatchItems };
}
