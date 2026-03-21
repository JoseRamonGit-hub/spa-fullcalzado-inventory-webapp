import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "@/services/productsService";
import { productKeys } from "./useProductQueries";
import type { ProductInsert, EditProductPayload } from "@/types/index";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductInsert) => productsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useCreateManyProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductInsert[]) => productsService.createMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EditProductPayload) => productsService.editProduct(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.p_product_id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
