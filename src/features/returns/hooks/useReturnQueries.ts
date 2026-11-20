import { skipToken, useQuery } from "@tanstack/react-query";
import { returnsService, type ReturnsFilter } from "@/services/returnsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

type ReturnQueryOptions = {
  enabled?: boolean;
};

export const returnKeys = {
  all: ["returns"] as const,
  business: (businessId: string | null) => [...returnKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...returnKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, filter: ReturnsFilter) => [...returnKeys.lists(businessId), filter] as const,
  today: (businessId: string | null) => [...returnKeys.business(businessId), "today"] as const,
};

export function useReturns(filter: ReturnsFilter = {}, options?: ReturnQueryOptions) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: returnKeys.list(businessId, filter),
    queryFn: businessId ? () => returnsService.getAll(businessId, filter) : skipToken,
    enabled: options?.enabled,
  });
}

export function useTodayReturns(options?: ReturnQueryOptions) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: returnKeys.today(businessId),
    queryFn: businessId ? () => returnsService.getToday(businessId) : skipToken,
    enabled: options?.enabled,
    refetchInterval: 30_000,
  });
}
