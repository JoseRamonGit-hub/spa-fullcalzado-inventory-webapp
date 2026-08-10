import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "@/services/productsService";
import { productKeys } from "./useProductQueries";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";
import type { AdjustProductStockPayload, ProductCreateInput, UpdateProductCatalogPayload } from "@/types/index";
import { activeBusinessMutationOptions } from "@/features/business/utils/active-business-mutation";
import { dashboardKeys } from "@/features/dashboard/hooks/useDashboardMetrics";

export function useCreateManyProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: ProductCreateInput[]) =>
      productsService.createMany(businessId, payload),
    ),
    onSuccess: (_, __, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.business(businessId) });
    },
  });
}

export function useUpdateProductCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: UpdateProductCatalogPayload) =>
      productsService.updateCatalog(businessId, payload),
    ),
    onSuccess: (_, payload, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(businessId, payload.p_product_id) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.business(businessId) });
    },
  });
}

export function useAdjustProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, payload: AdjustProductStockPayload) =>
      productsService.adjustStock(businessId, payload),
    ),
    onSuccess: (_, payload, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(businessId, payload.p_product_id) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.business(businessId) });
    },
    onError: (_, payload, context) => {
      if (!context) return;
      const { businessId } = context;
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(businessId, payload.p_product_id) });
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();

  return useMutation({
    ...activeBusinessMutationOptions((businessId, { id, active }: { id: string; active: boolean }) =>
      productsService.toggleActive(businessId, id, active),
    ),
    onSuccess: (_, { id }, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists(businessId) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(businessId, id) });
      queryClient.invalidateQueries({ queryKey: movementKeys.business(businessId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.business(businessId) });
    },
  });
}
