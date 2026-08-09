import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";
import { transactionKeys } from "./useTransactionQueries";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";
import { cashCloseKeys } from "@/features/cash-closes/hooks/useCashCloseQueries";
import type { ProcessSalePayload } from "@/types/index";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";
import { dashboardKeys } from "@/features/dashboard/hooks/useDashboardMetrics";

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: ProcessSalePayload) =>
      transactionsService.createSale(businessId, payload),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: productKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: cashCloseKeys.summaries(businessId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.business(businessId) });
    },
  });
}
