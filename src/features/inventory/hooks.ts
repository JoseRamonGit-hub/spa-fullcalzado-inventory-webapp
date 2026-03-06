import { useQuery } from "@tanstack/react-query"
import { productsService } from "@/services/productsService"

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => productsService.getAll(),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  })
}
