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

  const creditUsd = returnItems.reduce((acc, item) => acc + item.totalUsd, INITIAL_TOTAL);
  const creditVes = returnItems.reduce((acc, item) => acc + item.totalVes, INITIAL_TOTAL);
  const newPurchaseUsd = exchangeItems.reduce((acc, item) => acc + item.totalUsd, INITIAL_TOTAL);
  const newPurchaseVes = exchangeItems.reduce((acc, item) => acc + item.totalVes, INITIAL_TOTAL);

  const differenceUsd = newPurchaseUsd - creditUsd;
  const differenceVes = newPurchaseVes - creditVes;

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
