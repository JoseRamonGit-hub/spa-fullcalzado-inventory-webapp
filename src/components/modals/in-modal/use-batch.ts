import { useState, useCallback } from "react";
import type { BatchItem } from "./columns";

export interface UseBatchReturn {
  batchItems: BatchItem[];
  addItem: (item: BatchItem) => void;
  removeItem: (tempId: string) => void;
  clearBatch: () => void;
}

export function useBatch(): UseBatchReturn {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  const addItem = useCallback((item: BatchItem) => {
    setBatchItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((tempId: string) => {
    setBatchItems((prev) => prev.filter((i) => i._tempId !== tempId));
  }, []);

  const clearBatch = useCallback(() => {
    setBatchItems([]);
  }, []);

  return { batchItems, addItem, removeItem, clearBatch };
}
