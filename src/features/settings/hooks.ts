import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exchangeRatesService } from "@/services/exchangeRatesService";
import type { ExchangeRateInsert } from "@/types/index";

export function useExchangeRateHistory() {
  return useQuery({
    queryKey: ["exchangeRate", "history"],
    queryFn: () => exchangeRatesService.getHistory(),
  });
}

export function useUpdateExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExchangeRateInsert) => exchangeRatesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
