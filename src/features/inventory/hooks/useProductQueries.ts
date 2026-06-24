import { skipToken, useQuery } from "@tanstack/react-query";
import { productsService } from "@/services/productsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

export const productKeys = {
  all: ["products"] as const,
  business: (businessId: string | null) => [...productKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...productKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, date?: string) => [...productKeys.lists(businessId), { date }] as const,
};

export function useProducts(date?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: productKeys.list(businessId, date),
    queryFn: businessId ? () => productsService.getAll(businessId, date) : skipToken,
  });
}
