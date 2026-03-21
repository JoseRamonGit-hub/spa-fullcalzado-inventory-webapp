import { useCallback, useMemo } from "react";
import { useProducts } from "@/features/inventory/hooks/useProductQueries";
import type { Product } from "@/types/index";
import type { ProductSearchResult } from "@/components/product-search";

function toProductSearchResult(product: Product): ProductSearchResult {
  return {
    id: product.id,
    code: product.code,
    description: product.description,
    price_usd: product.price_usd,
    stock: product.stock,
  };
}

export function useProductLookup() {
  const { data: products } = useProducts();

  const productsById = useMemo(
    () => new Map((products ?? []).map((product) => [product.id, toProductSearchResult(product)])),
    [products],
  );

  const getProductById = useCallback(
    (productId: string) => {
      if (!productId) return null;
      return productsById.get(productId) ?? null;
    },
    [productsById],
  );

  return { getProductById };
}

export function focusFirstNumberInput(formElement: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    const quantityInput = formElement?.querySelector<HTMLInputElement>('input[type="number"]');
    quantityInput?.focus();
    quantityInput?.select();
  });
}
