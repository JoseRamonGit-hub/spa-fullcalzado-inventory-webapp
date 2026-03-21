import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { cashClosesService } from "@/services/cashClosesService";

export const cashCloseKeys = {
  all: ["cash-closes"] as const,
  lists: () => [...cashCloseKeys.all, "list"] as const,
  list: (date?: string) => [...cashCloseKeys.lists(), { date }] as const,
};

export function useCashCloses(date?: string) {
  return useQuery({
    queryKey: cashCloseKeys.list(date),
    queryFn: () => cashClosesService.getAll(date),
    placeholderData: keepPreviousData,
  });
}
