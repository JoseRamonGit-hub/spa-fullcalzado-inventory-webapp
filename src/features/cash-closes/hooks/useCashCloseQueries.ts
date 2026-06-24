import { skipToken, useQuery } from "@tanstack/react-query";
import { cashClosesService } from "@/services/cashClosesService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

export const cashCloseKeys = {
  all: ["cash-closes"] as const,
  business: (businessId: string | null) => [...cashCloseKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...cashCloseKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, date?: string) => [...cashCloseKeys.lists(businessId), { date }] as const,
};

export function useCashCloses(date?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: cashCloseKeys.list(businessId, date),
    queryFn: businessId ? () => cashClosesService.getAll(businessId, date) : skipToken,
  });
}
