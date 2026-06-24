import { useDeferredValue, useMemo, useState } from "react";
import type { Product } from "@/types";

export function useProductSearch(products: Product[] | undefined) {
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!deferredSearch) return products;

    const query = deferredSearch.toLowerCase();
    return products.filter(
      (product) => product.code.toLowerCase().includes(query) || product.description.toLowerCase().includes(query),
    );
  }, [products, deferredSearch]);

  return {
    searchInput,
    setSearchInput,
    filteredProducts,
  };
}
