import { skipToken, useQuery } from "@tanstack/react-query";
import { exchangeRatesService } from "@/services/exchangeRatesService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

export const exchangeRateKeys = {
  all: ["exchangeRate"] as const,
  business: (businessId: string | null) => [...exchangeRateKeys.all, businessId] as const,
  current: (businessId: string | null) => [...exchangeRateKeys.business(businessId), "current"] as const,
  history: (businessId: string | null) => [...exchangeRateKeys.business(businessId), "history"] as const,
};

export function useExchangeRate() {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: exchangeRateKeys.current(businessId),
    queryFn: businessId ? () => exchangeRatesService.getCurrent(businessId) : skipToken,
  });
}

export function useExchangeRateHistory(options?: { enabled?: boolean }) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: exchangeRateKeys.history(businessId),
    queryFn: businessId ? () => exchangeRatesService.getHistory(businessId) : skipToken,
    enabled: options?.enabled,
  });
}
