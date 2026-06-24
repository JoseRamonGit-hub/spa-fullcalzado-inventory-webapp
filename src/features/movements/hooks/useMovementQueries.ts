import { skipToken, useQuery } from "@tanstack/react-query";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";

export const movementKeys = {
  all: ["movements"] as const,
  business: (businessId: string | null) => [...movementKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...movementKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, date?: string) => [...movementKeys.lists(businessId), { date }] as const,
};

export function useMovements(date?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: movementKeys.list(businessId, date),
    queryFn: businessId ? () => inventoryMovementsService.getAll(businessId, date) : skipToken,
  });
}
