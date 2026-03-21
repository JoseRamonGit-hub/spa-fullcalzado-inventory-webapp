import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { returnsService } from "@/services/returnsService";

type ReturnQueryOptions = {
  enabled?: boolean;
};

export const returnKeys = {
  all: ["returns"] as const,
  lists: () => [...returnKeys.all, "list"] as const,
  list: (date?: string) => [...returnKeys.lists(), { date }] as const,
  today: () => [...returnKeys.all, "today"] as const,
};

export function useReturns(date?: string, options?: ReturnQueryOptions) {
  return useQuery({
    queryKey: returnKeys.list(date),
    queryFn: () => returnsService.getAll(date),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useTodayReturns(options?: ReturnQueryOptions) {
  return useQuery({
    queryKey: returnKeys.today(),
    queryFn: () => returnsService.getToday(),
    enabled: options?.enabled,
    refetchInterval: 30_000,
  });
}
