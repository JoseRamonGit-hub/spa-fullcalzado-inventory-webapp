import type { PendingReturnItem, PendingExchangeItem } from "../types";
import { sumCurrencyTotals } from "@/components/modals/shared/currency-totals";
import { usePendingItems } from "@/components/modals/shared/use-pending-items";

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

  const credit = sumCurrencyTotals(returnItems);
  const newPurchase = sumCurrencyTotals(exchangeItems);

  const differenceUsd = newPurchase.usd - credit.usd;
  const differenceVes = newPurchase.ves - credit.ves;

  const returnType = exchangeItems.length > 0 ? "exchange" : "refund";

  return {
    returnItems,
    exchangeItems,
    addReturnItem,
    removeReturnItem,
    addExchangeItem,
    removeExchangeItem,
    clearAll,
    creditUsd: credit.usd,
    creditVes: credit.ves,
    newPurchaseUsd: newPurchase.usd,
    newPurchaseVes: newPurchase.ves,
    differenceUsd,
    differenceVes,
    returnType,
  } as const;
}
