import { useQuery } from "@tanstack/react-query";
import { exchangeRatesService } from "@/services/exchangeRatesService";

export function useExchangeRate() {
  return useQuery({
    queryKey: ["exchangeRate"],
    queryFn: () => exchangeRatesService.getCurrent(),
  });
}
