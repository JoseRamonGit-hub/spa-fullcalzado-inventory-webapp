import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";

export const movementKeys = {
  all: ["movements"] as const,
  lists: () => [...movementKeys.all, "list"] as const,
  list: (date?: string) => [...movementKeys.lists(), { date }] as const,
};

export function useMovements(date?: string) {
  return useQuery({
    queryKey: movementKeys.list(date),
    queryFn: () => inventoryMovementsService.getAll(date),
    placeholderData: keepPreviousData,
  });
}
