import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cashClosesService } from "@/services/cashClosesService";
import { transactionKeys } from "@/features/transactions/hooks/useTransactionQueries";
import { cashCloseKeys } from "./useCashCloseQueries";

export function useGenerateCashClose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => cashClosesService.generateDailyCashClose(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashCloseKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}
