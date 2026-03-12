import { useQuery } from "@tanstack/react-query";
import { cashClosesService } from "@/services/cashClosesService";

export function useCashCloses(date?: string) {
  return useQuery({
    queryKey: ["cash-closes", { date }],
    queryFn: () => cashClosesService.getAll(date),
  });
}
