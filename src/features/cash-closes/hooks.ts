import { useQuery } from "@tanstack/react-query"
import { cashClosesService } from "@/services/cashClosesService"

export function useCashCloses() {
  return useQuery({
    queryKey: ["cash-closes"],
    queryFn: () => cashClosesService.getAll(),
  })
}
