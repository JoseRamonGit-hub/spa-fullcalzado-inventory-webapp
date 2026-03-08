import { useQuery } from "@tanstack/react-query";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";

export function useMovements() {
  return useQuery({
    queryKey: ["movements"],
    queryFn: () => inventoryMovementsService.getAll(),
  });
}
