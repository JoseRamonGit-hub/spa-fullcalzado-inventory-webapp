import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";
import type { TransactionInsert } from "@/types/index";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsService.getAll(),
  });
}

export function useTodayTransactions() {
  return useQuery({
    queryKey: ["transactions", "today"],
    queryFn: () => transactionsService.getToday(),
    refetchInterval: 30_000, // Refresh every 30s for live metrics
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionInsert) => transactionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateManyTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionInsert[]) => transactionsService.createMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
