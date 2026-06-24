import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cashClosesService } from "@/services/cashClosesService";
import { transactionKeys } from "@/features/transactions/hooks/useTransactionQueries";
import { cashCloseKeys } from "./useCashCloseQueries";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";

export function useGenerateCashClose() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId) => cashClosesService.generateDailyCashClose(businessId)),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: cashCloseKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.business(businessId) });
    },
  });
}
