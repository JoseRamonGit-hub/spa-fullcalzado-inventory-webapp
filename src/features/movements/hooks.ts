import { useQuery } from "@tanstack/react-query";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";

export function useMovements(date?: string) {
  return useQuery({
    queryKey: ["movements", { date }],
    queryFn: () => inventoryMovementsService.getAll(date),
  });
}
