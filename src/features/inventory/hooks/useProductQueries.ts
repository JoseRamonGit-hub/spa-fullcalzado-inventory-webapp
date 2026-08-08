import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { productsService } from "@/services/productsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { ProductHistoryRange } from "@/types";

export const productKeys = {
  all: ["products"] as const,
  business: (businessId: string | null) => [...productKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...productKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, date?: string) => [...productKeys.lists(businessId), { date }] as const,
  details: (businessId: string | null) => [...productKeys.business(businessId), "detail"] as const,
  detail: (businessId: string | null, productId: string) => [...productKeys.details(businessId), productId] as const,
  history: (businessId: string | null, productId: string, range: ProductHistoryRange | null) =>
    [...productKeys.detail(businessId, productId), "history", range] as const,
};

const productDetailQueryOptions = (businessId: string | null, productId: string) =>
  queryOptions({
    queryKey: productKeys.detail(businessId, productId),
    queryFn: businessId ? () => productsService.getDetail(businessId, productId) : skipToken,
  });

export function useProducts(date?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: productKeys.list(businessId, date),
    queryFn: businessId ? () => productsService.getAll(businessId, date) : skipToken,
  });
}

export function useProductDetail(productId: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery(productDetailQueryOptions(businessId, productId));
}
