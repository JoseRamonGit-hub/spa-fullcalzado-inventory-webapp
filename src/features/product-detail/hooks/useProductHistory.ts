import { skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";

export function useProductHistory(productId: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: productKeys.history(businessId, productId),
    queryFn: businessId ? () => inventoryMovementsService.getProductHistory(businessId, productId) : skipToken,
  });
}
