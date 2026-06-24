import { skipToken, useQuery } from "@tanstack/react-query";
import { returnsService } from "@/services/returnsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

type ReturnQueryOptions = {
  enabled?: boolean;
};

export const returnKeys = {
  all: ["returns"] as const,
  business: (businessId: string | null) => [...returnKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...returnKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, date?: string) => [...returnKeys.lists(businessId), { date }] as const,
  today: (businessId: string | null) => [...returnKeys.business(businessId), "today"] as const,
};

export function useReturns(date?: string, options?: ReturnQueryOptions) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: returnKeys.list(businessId, date),
    queryFn: businessId ? () => returnsService.getAll(businessId, date) : skipToken,
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
