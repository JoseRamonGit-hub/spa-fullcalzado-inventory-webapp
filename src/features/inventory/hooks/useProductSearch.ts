import { useDeferredValue, useMemo, useState } from "react";
import type { Product } from "@/types";
import { normalizeSearchValue } from "@/utils/search";

export function useProductSearch<TProduct extends Product>(products: TProduct[] | undefined) {
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const query = normalizeSearchValue(deferredSearch);
    if (!query) return products;

    return products.filter(
      (product) =>
        normalizeSearchValue(product.code).includes(query) || normalizeSearchValue(product.description).includes(query),
    );
  }, [products, deferredSearch]);

  return {
    searchInput,
    setSearchInput,
    filteredProducts,
  };
}
