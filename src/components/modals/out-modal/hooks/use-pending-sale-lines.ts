import type { PendingSaleLine } from "../types";
import { sumCurrencyTotals } from "@/components/modals/shared/currency-totals";
import { usePendingItems } from "@/components/modals/shared/use-pending-items";

export interface PendingSaleLinesState {
  pendingSaleLines: PendingSaleLine[];
  addPendingSaleLine: (saleLine: PendingSaleLine) => void;
  removePendingSaleLine: (tempId: string) => void;
  clearPendingSaleLines: () => void;
  totalAmountUsd: number;
  totalAmountVes: number;
}

export function usePendingSaleLines(): PendingSaleLinesState {
  const { items: pendingSaleLines, addItem, removeItem, clearItems } = usePendingItems<PendingSaleLine>();

  const totals = sumCurrencyTotals(pendingSaleLines);

  return {
    pendingSaleLines,
    addPendingSaleLine: addItem,
    removePendingSaleLine: removeItem,
    clearPendingSaleLines: clearItems,
    totalAmountUsd: totals.usd,
    totalAmountVes: totals.ves,
  };
}
