import { useProducts } from "@/features/inventory/hooks/useProductQueries";
import { toSearchResult } from "@/components/product-search/utils";

export function useProductLookup() {
  const { data: products } = useProducts();

  const productsById = new Map((products ?? []).map((product) => [product.id, toSearchResult(product)]));

  function getProductById(productId: string) {
    if (!productId) return null;
    return productsById.get(productId) ?? null;
  }

  return { getProductById };
}

export function focusFirstNumberInput(formElement: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    const quantityInput = formElement?.querySelector<HTMLInputElement>('input[type="number"]');
    quantityInput?.focus();
    quantityInput?.select();
  });
}
