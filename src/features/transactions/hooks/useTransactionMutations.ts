import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";
import { transactionKeys } from "./useTransactionQueries";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import type { TransactionInsert } from "@/types/index";

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionInsert) => transactionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useCreateManyTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionInsert[]) => transactionsService.createMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
