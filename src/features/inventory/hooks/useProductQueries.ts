import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { productsService } from "@/services/productsService";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (date?: string) => [...productKeys.lists(), { date }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export function useProducts(date?: string) {
  return useQuery({
    queryKey: productKeys.list(date),
    queryFn: () => productsService.getAll(date),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => productsService.getById(id!),
    enabled: !!id,
  });
}
