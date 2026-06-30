export type NewBatchItem = {
  kind: "new";
  tempId: string;
  code: string;
  description: string;
  priceUsd: number;
  initialStock: number;
};

export type ExistingBatchItem = {
  kind: "existing";
  tempId: string;
  productId: string;
  code: string;
  description: string;
  addedQuantity: number;
  currentStock: number;
  currentPriceUsd: number;
  priceUsd?: number;
  originalPriceUsd?: number;
};

export type BatchItem = NewBatchItem | ExistingBatchItem;

export function isNewBatchItem(item: BatchItem): item is NewBatchItem {
  return item.kind === "new";
}

export function isExistingBatchItem(item: BatchItem): item is ExistingBatchItem {
  return item.kind === "existing";
}
