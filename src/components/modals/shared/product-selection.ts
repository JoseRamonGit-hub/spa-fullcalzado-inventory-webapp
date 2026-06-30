import { useProducts } from "@/features/inventory/hooks/useProductQueries";
import { toSearchResult } from "@/components/product-search/utils";

export const MINIMUM_PRODUCT_QUANTITY = 1;
export const PRODUCT_SELECTION_REQUIRED_ERROR = "Selecciona un producto";

const REQUIRED_FIELD_ERROR = "Requerido";
const MINIMUM_QUANTITY_ERROR = "Mín. 1";

export function validateProductSelection(productId: string) {
  return productId ? undefined : PRODUCT_SELECTION_REQUIRED_ERROR;
}

export function validateProductQuantity(value: number, availableStock?: number) {
  const isEmpty = value === undefined || value === null || String(value) === "";
  if (isEmpty) return REQUIRED_FIELD_ERROR;
  if (value < MINIMUM_PRODUCT_QUANTITY) return MINIMUM_QUANTITY_ERROR;
  if (availableStock != null && value > availableStock) {
    return `Stock insuficiente (disponible: ${availableStock})`;
  }

  return undefined;
}

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
