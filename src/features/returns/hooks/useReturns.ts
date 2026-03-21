import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { returnsService } from "@/services/returnsService";
import type { ProcessReturnPayload } from "@/types/index";

type ReturnQueryOptions = {
  enabled?: boolean;
};

// ---------- Query Keys Factory ----------
export const returnKeys = {
  all: ["returns"] as const,
  lists: () => [...returnKeys.all, "list"] as const,
  list: (date?: string) => [...returnKeys.lists(), { date }] as const,
  today: () => [...returnKeys.all, "today"] as const,
};

// ---------- Queries ----------
export function useReturns(date?: string, options?: ReturnQueryOptions) {
  return useQuery({
    queryKey: returnKeys.list(date),
    queryFn: () => returnsService.getAll(date),
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

// ---------- Mutations ----------
export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessReturnPayload) => returnsService.processReturn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
    },
  });
}
