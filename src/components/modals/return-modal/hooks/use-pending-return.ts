import { useMemo } from "react";
import type { PendingReturnItem, PendingExchangeItem } from "../types";
import { usePendingItems } from "@/components/modals/shared/use-pending-items";

const INITIAL_TOTAL = 0;

export function usePendingReturn() {
  const {
    items: returnItems,
    addItem: addReturnItem,
    removeItem: removeReturnItem,
    clearItems: clearReturnItems,
  } = usePendingItems<PendingReturnItem>();
  const {
    items: exchangeItems,
    addItem: addExchangeItem,
    removeItem: removeExchangeItem,
    clearItems: clearExchangeItems,
  } = usePendingItems<PendingExchangeItem>();

  const clearAll = () => {
    clearReturnItems();
    clearExchangeItems();
  };

  // ── Calculated totals ─────────────────────────────────────
  const creditUsd = useMemo(() => returnItems.reduce((acc, item) => acc + item.totalUsd, INITIAL_TOTAL), [returnItems]);

  const creditVes = useMemo(() => returnItems.reduce((acc, item) => acc + item.totalVes, INITIAL_TOTAL), [returnItems]);

  const newPurchaseUsd = useMemo(
    () => exchangeItems.reduce((acc, item) => acc + item.totalUsd, INITIAL_TOTAL),
    [exchangeItems],
  );

  const newPurchaseVes = useMemo(
    () => exchangeItems.reduce((acc, item) => acc + item.totalVes, INITIAL_TOTAL),
    [exchangeItems],
  );

  const differenceUsd = newPurchaseUsd - creditUsd;
  const differenceVes = newPurchaseVes - creditVes;

  // Type is 'refund' if there are no exchange items, 'exchange' otherwise
  const returnType = exchangeItems.length > 0 ? "exchange" : "refund";

  return {
    returnItems,
    exchangeItems,
    addReturnItem,
    removeReturnItem,
    addExchangeItem,
    removeExchangeItem,
    clearAll,
    creditUsd,
    creditVes,
    newPurchaseUsd,
    newPurchaseVes,
    differenceUsd,
    differenceVes,
    returnType,
  } as const;
}
