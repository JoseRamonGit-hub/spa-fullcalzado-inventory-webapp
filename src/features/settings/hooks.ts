import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exchangeRatesService } from "@/services/exchangeRatesService";
import { exchangeRateKeys } from "@/features/exchange_rates/hooks";
import type { ExchangeRateInsert } from "@/types/index";

type ExchangeRateHistoryOptions = {
  enabled?: boolean;
};

export function useExchangeRateHistory(options?: ExchangeRateHistoryOptions) {
  return useQuery({
    queryKey: exchangeRateKeys.history(),
    queryFn: () => exchangeRatesService.getHistory(),
    enabled: options?.enabled,
  });
}

export function useUpdateExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExchangeRateInsert) => exchangeRatesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all });
    },
  });
}
