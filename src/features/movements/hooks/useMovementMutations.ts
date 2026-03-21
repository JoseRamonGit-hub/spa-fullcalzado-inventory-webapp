import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { movementKeys } from "./useMovementQueries";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";

export function useCreateManyMovements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payloads: Parameters<typeof inventoryMovementsService.createMany>[0]) =>
      inventoryMovementsService.createMany(payloads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
