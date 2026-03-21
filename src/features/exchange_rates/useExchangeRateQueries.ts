import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { exchangeRatesService } from "@/services/exchangeRatesService";

export const exchangeRateKeys = {
  all: ["exchangeRate"] as const,
  current: () => [...exchangeRateKeys.all, "current"] as const,
  history: () => [...exchangeRateKeys.all, "history"] as const,
};

export function useExchangeRate() {
  return useQuery({
    queryKey: exchangeRateKeys.current(),
    queryFn: () => exchangeRatesService.getCurrent(),
    placeholderData: keepPreviousData,
  });
}

export function useExchangeRateHistory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: exchangeRateKeys.history(),
    queryFn: () => exchangeRatesService.getHistory(),
    enabled: options?.enabled,
  });
}
