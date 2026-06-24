import { skipToken, useQuery } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

type TransactionQueryOptions = {
  enabled?: boolean;
};

export const transactionKeys = {
  all: ["transactions"] as const,
  business: (businessId: string | null) => [...transactionKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...transactionKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, date?: string) => [...transactionKeys.lists(businessId), { date }] as const,
  today: (businessId: string | null) => [...transactionKeys.business(businessId), "today"] as const,
};

export function useTransactions(date?: string, options?: TransactionQueryOptions) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: transactionKeys.list(businessId, date),
    queryFn: businessId ? () => transactionsService.getAll(businessId, date) : skipToken,
    enabled: options?.enabled,
  });
}

export function useTodayTransactions(options?: TransactionQueryOptions) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: transactionKeys.today(businessId),
    queryFn: businessId ? () => transactionsService.getToday(businessId) : skipToken,
    enabled: options?.enabled,
    refetchInterval: 30_000,
  });
}
