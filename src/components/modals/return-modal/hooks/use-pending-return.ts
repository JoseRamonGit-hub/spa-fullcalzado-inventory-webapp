import { useState, useCallback, useMemo } from "react";
import type { PendingReturnItem, PendingExchangeItem } from "../types";

const INITIAL_TOTAL = 0;

export function usePendingReturn() {
  const [returnItems, setReturnItems] = useState<PendingReturnItem[]>([]);
  const [exchangeItems, setExchangeItems] = useState<PendingExchangeItem[]>([]);

  // ── Return items (products the customer is returning) ──────
  const addReturnItem = useCallback((item: PendingReturnItem) => {
    setReturnItems((prev) => [...prev, item]);
  }, []);

  const removeReturnItem = useCallback((tempId: string) => {
    setReturnItems((prev) => prev.filter((item) => item._tempId !== tempId));
  }, []);

  // ── Exchange items (new products the customer is taking) ───
  const addExchangeItem = useCallback((item: PendingExchangeItem) => {
    setExchangeItems((prev) => [...prev, item]);
  }, []);

  const removeExchangeItem = useCallback((tempId: string) => {
    setExchangeItems((prev) => prev.filter((item) => item._tempId !== tempId));
  }, []);

  // ── Clear all ──────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setReturnItems([]);
    setExchangeItems([]);
  }, []);

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
