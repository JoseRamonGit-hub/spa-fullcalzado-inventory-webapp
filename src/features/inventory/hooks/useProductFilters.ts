import { useDeferredValue, useMemo, useState } from "react";
import type { Product } from "@/types";

export type StockFilter = "all" | "in-stock" | "no-stock";

export function useProductFilters(products: Product[] | undefined) {
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

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
    setSearchInput,
    stockFilter,
    setStockFilter,
    filteredProducts,
  };
}
