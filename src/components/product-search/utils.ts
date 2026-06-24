import type { Product } from "@/types";
import type { ProductSearchResult } from "./types";

export function toSearchResult(product: Product): ProductSearchResult {
  return {
    id: product.id,
    code: product.code,
    description: product.description,
    price_usd: product.price_usd,
    stock: product.stock,
  };
}
