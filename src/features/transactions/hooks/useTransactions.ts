import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";
import type { TransactionInsert } from "@/types/index";

type TransactionQueryOptions = {
  enabled?: boolean;
};

// ---------- Query Keys Factory ----------
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (date?: string) => [...transactionKeys.lists(), { date }] as const,
  today: () => [...transactionKeys.all, "today"] as const,
};

// ---------- Queries ----------
export function useTransactions(date?: string, options?: TransactionQueryOptions) {
  return useQuery({
    queryKey: transactionKeys.list(date),
    queryFn: () => transactionsService.getAll(date),
    enabled: options?.enabled,
  });
}

export function useTodayTransactions(options?: TransactionQueryOptions) {
  return useQuery({
    queryKey: transactionKeys.today(),
    queryFn: () => transactionsService.getToday(),
    enabled: options?.enabled,
    refetchInterval: 30_000, // Refresh every 30s for live metrics
  });
}

// ---------- Mutations ----------
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionInsert) => transactionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateManyTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionInsert[]) => transactionsService.createMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
