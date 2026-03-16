import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";

// ---------- Query Keys Factory ----------
export const movementKeys = {
  all: ["movements"] as const,
  lists: () => [...movementKeys.all, "list"] as const,
  list: (date?: string) => [...movementKeys.lists(), { date }] as const,
};

// ---------- Queries ----------
export function useMovements(date?: string) {
  return useQuery({
    queryKey: movementKeys.list(date),
    queryFn: () => inventoryMovementsService.getAll(date),
  });
}

// ---------- Mutations ----------
export function useCreateManyMovements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payloads: Parameters<typeof inventoryMovementsService.createMany>[0]) =>
      inventoryMovementsService.createMany(payloads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
