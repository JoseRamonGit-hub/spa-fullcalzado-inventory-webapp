import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exchangeRatesService } from "@/services/exchangeRatesService";
import { exchangeRateKeys } from "./useExchangeRateQueries";
import type { ExchangeRateCreateInput } from "@/types/index";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";

export function useUpdateExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: ExchangeRateCreateInput) =>
      exchangeRatesService.create(businessId, payload),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.business(businessId) });
    },
  });
}
