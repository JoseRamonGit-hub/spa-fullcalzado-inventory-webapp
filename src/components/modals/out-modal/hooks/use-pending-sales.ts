import { useMemo } from "react";
import type { PendingSale } from "../types";
import { usePendingItems } from "@/components/modals/shared/use-pending-items";

const INITIAL_TOTAL = 0;

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

  const totalAmountUsd = useMemo(
    () => pendingSales.reduce((accumulator, sale) => accumulator + sale.totalUsd, INITIAL_TOTAL),
    [pendingSales],
  );

  const totalAmountVes = useMemo(
    () => pendingSales.reduce((accumulator, sale) => accumulator + sale.totalVes, INITIAL_TOTAL),
    [pendingSales],
  );

  return {
    pendingSales,
    addPendingSale: addItem,
    removePendingSale: removeItem,
    clearPendingSales: clearItems,
    totalAmountUsd,
    totalAmountVes,
  };
}
