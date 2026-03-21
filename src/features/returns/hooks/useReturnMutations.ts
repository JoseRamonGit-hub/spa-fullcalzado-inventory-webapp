import { useMutation, useQueryClient } from "@tanstack/react-query";
import { returnsService } from "@/services/returnsService";
import { returnKeys } from "./useReturnQueries";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import { transactionKeys } from "@/features/transactions/hooks/useTransactionQueries";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";
import type { ProcessReturnPayload } from "@/types/index";

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessReturnPayload) => returnsService.processReturn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: movementKeys.all });
      queryClient.invalidateQueries({ queryKey: returnKeys.all });
    },
  });
}
