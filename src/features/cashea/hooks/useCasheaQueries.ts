import { skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { casheaService } from "@/services/casheaService";
import type { CasheaOrdersFilter } from "@/types";

export const casheaKeys = {
  all: ["cashea"] as const,
  business: (businessId: string | null) => [...casheaKeys.all, businessId] as const,
  orders: (businessId: string | null) => [...casheaKeys.business(businessId), "orders"] as const,
  orderList: (businessId: string | null, filter: CasheaOrdersFilter) =>
    [...casheaKeys.orders(businessId), filter] as const,
};

export function useCasheaOrders(filter: CasheaOrdersFilter) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.orderList(businessId, filter),
    queryFn: businessId ? () => casheaService.getOrders(businessId, filter) : skipToken,
  });
}
