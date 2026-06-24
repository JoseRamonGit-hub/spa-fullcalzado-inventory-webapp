import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "@/services/productsService";
import { productKeys } from "./useProductQueries";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";
import type { ProductCreateInput, EditProductPayload } from "@/types/index";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";

export function useCreateManyProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: ProductCreateInput[]) =>
      productsService.createMany(businessId, payload),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: EditProductPayload) =>
      productsService.editProduct(businessId, payload),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, { id, active }: { id: string; active: boolean }) =>
      productsService.toggleActive(businessId, id, active),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
    },
  });
}
