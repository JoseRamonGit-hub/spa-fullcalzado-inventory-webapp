import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";
import { transactionKeys } from "./useTransactionQueries";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";
import type { TransactionCreateInput } from "@/types/index";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";

export function useCreateManyTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: TransactionCreateInput[]) =>
      transactionsService.createMany(businessId, payload),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: productKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
    },
  });
}
