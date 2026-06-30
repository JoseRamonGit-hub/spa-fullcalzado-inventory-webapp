import type { PendingSale } from "../types";
import { sumCurrencyTotals } from "@/components/modals/shared/currency-totals";
import { usePendingItems } from "@/components/modals/shared/use-pending-items";

export interface UsePendingSalesReturn {
  pendingSales: PendingSale[];
  addPendingSale: (sale: PendingSale) => void;
  removePendingSale: (tempId: string) => void;
  clearPendingSales: () => void;
  totalAmountUsd: number;
  totalAmountVes: number;
}

export function usePendingSales(): UsePendingSalesReturn {
  const { items: pendingSales, addItem, removeItem, clearItems } = usePendingItems<PendingSale>();

  const totals = sumCurrencyTotals(pendingSales);

  return {
    pendingSales,
    addPendingSale: addItem,
    removePendingSale: removeItem,
    clearPendingSales: clearItems,
    totalAmountUsd: totals.usd,
    totalAmountVes: totals.ves,
  };
}
