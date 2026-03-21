import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";

type TransactionQueryOptions = {
  enabled?: boolean;
};

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (date?: string) => [...transactionKeys.lists(), { date }] as const,
  today: () => [...transactionKeys.all, "today"] as const,
};

export function useTransactions(date?: string, options?: TransactionQueryOptions) {
  return useQuery({
    queryKey: transactionKeys.list(date),
    queryFn: () => transactionsService.getAll(date),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useTodayTransactions(options?: TransactionQueryOptions) {
  return useQuery({
    queryKey: transactionKeys.today(),
    queryFn: () => transactionsService.getToday(),
    enabled: options?.enabled,
    refetchInterval: 30_000,
  });
}
