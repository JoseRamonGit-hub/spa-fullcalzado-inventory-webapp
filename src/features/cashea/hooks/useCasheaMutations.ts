import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { casheaService } from "@/services/casheaService";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";
import { transactionKeys } from "@/features/transactions/hooks/useTransactionQueries";
import { cashCloseKeys } from "@/features/cash-closes/hooks/useCashCloseQueries";
import { dashboardKeys } from "@/features/dashboard/hooks/useDashboardMetrics";
import type { CasheaOrderInput, CasheaVoidReason } from "@/types";
import { casheaKeys } from "./useCasheaQueries";

type AttachCasheaOrderVariables = {
  saleId: string;
  order: CasheaOrderInput;
};

type VoidCasheaOrderVariables = {
  orderId: string;
  reason: CasheaVoidReason;
  note: string;
};

function invalidateCasheaDependents(queryClient: QueryClient, businessId: string) {
  queryClient.invalidateQueries({ queryKey: transactionKeys.business(businessId) });
  queryClient.invalidateQueries({ queryKey: cashCloseKeys.summaries(businessId) });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.business(businessId) });
  queryClient.invalidateQueries({ queryKey: casheaKeys.business(businessId) });
}

export function useAttachCasheaOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, { saleId, order }: AttachCasheaOrderVariables) =>
      casheaService.attachOrder(businessId, saleId, order),
    ),
    onSuccess: (_, __, { businessId }) => invalidateCasheaDependents(queryClient, businessId),
  });
}

export function useVoidCasheaOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, { orderId, reason, note }: VoidCasheaOrderVariables) =>
      casheaService.voidOrder(businessId, orderId, reason, note),
    ),
    onSuccess: (_, __, { businessId }) => invalidateCasheaDependents(queryClient, businessId),
  });
}
