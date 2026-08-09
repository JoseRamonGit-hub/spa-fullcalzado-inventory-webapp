import { skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { productKeys } from "@/features/inventory/hooks/useProductQueries";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import type { ProductHistoryRange } from "@/types";

export function useProductHistory(productId: string, range: ProductHistoryRange | null) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: productKeys.history(businessId, productId, range),
    queryFn:
      businessId && range ? () => inventoryMovementsService.getProductHistory(businessId, productId, range) : skipToken,
  });
}
