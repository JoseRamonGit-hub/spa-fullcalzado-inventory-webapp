import { useState, useTransition, useCallback, useMemo } from "react";
import type { Product } from "@/types";

export type StockFilter = "all" | "in-stock" | "no-stock";

export function useProductFilters(products: Product[] | undefined) {
  const [searchInput, setSearchInput] = useState("");
  const [deferredSearch, setDeferredSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [, startTransition] = useTransition();

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      startTransition(() => {
        setDeferredSearch(value);
      });
    },
    [startTransition],
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      result = result.filter((p) => p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (stockFilter === "in-stock") {
      result = result.filter((p) => p.stock > 0);
    } else if (stockFilter === "no-stock") {
      result = result.filter((p) => p.stock === 0);
    }

    return result;
  }, [products, deferredSearch, stockFilter]);

  return {
    searchInput,
    handleSearchChange,
    stockFilter,
    setStockFilter,
    filteredProducts,
  };
}
