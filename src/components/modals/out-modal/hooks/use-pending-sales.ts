import { useState, useCallback, useMemo } from "react";
import type { PendingSale } from "../types";

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
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  const addPendingSale = useCallback((sale: PendingSale) => {
    setPendingSales((prevSales) => [...prevSales, sale]);
  }, []);

  const removePendingSale = useCallback((tempId: string) => {
    setPendingSales((prevSales) => prevSales.filter((sale) => sale._tempId !== tempId));
  }, []);

  const clearPendingSales = useCallback(() => {
    setPendingSales([]);
  }, []);

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
    addPendingSale,
    removePendingSale,
    clearPendingSales,
    totalAmountUsd,
    totalAmountVes,
  };
}
