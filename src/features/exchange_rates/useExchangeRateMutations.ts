import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exchangeRatesService } from "@/services/exchangeRatesService";
import { exchangeRateKeys } from "./useExchangeRateQueries";
import type { ExchangeRateInsert } from "@/types/index";

export function useUpdateExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExchangeRateInsert) => exchangeRatesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all });
    },
  });
}
