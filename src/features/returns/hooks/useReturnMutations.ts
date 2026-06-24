import { useMutation, useQueryClient } from "@tanstack/react-query";
import { returnsService } from "@/services/returnsService";
import { returnKeys } from "./useReturnQueries";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import { transactionKeys } from "@/features/transactions/hooks/useTransactionQueries";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";
import type { ProcessReturnPayload } from "@/types/index";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: ProcessReturnPayload) =>
      returnsService.processReturn(businessId, payload),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: returnKeys.business(businessId) });
    },
  });
}
