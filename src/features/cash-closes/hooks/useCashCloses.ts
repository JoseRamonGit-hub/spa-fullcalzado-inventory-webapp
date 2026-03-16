import { useQuery } from "@tanstack/react-query";
import { cashClosesService } from "@/services/cashClosesService";

// ---------- Query Keys Factory ----------
export const cashCloseKeys = {
  all: ["cash-closes"] as const,
  lists: () => [...cashCloseKeys.all, "list"] as const,
  list: (date?: string) => [...cashCloseKeys.lists(), { date }] as const,
};

// ---------- Queries ----------
export function useCashCloses(date?: string) {
  return useQuery({
    queryKey: cashCloseKeys.list(date),
    queryFn: () => cashClosesService.getAll(date),
  });
}
