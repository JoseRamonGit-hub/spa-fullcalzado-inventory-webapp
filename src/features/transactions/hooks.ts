import { useQuery } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactionsService";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsService.getAll(),
  });
}

export function useTodayTransactions() {
  return useQuery({
    queryKey: ["transactions", "today"],
    queryFn: () => transactionsService.getToday(),
    refetchInterval: 30_000, // Refresh every 30s for live metrics
  });
}
