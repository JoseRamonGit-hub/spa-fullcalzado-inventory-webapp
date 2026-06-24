import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { movementKeys } from "./useMovementQueries";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";

export function useCreateManyMovements() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions(
      (businessId, payloads: Parameters<typeof inventoryMovementsService.createMany>[1]) =>
        inventoryMovementsService.createMany(businessId, payloads),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: productKeys.business(businessId) });
    },
  });
}
