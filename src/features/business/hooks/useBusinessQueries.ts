import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { businessesService } from "@/services/businessesService";

export const businessKeys = {
  all: ["businesses"] as const,
  accessible: (userId: string | null) => [...businessKeys.all, "accessible", userId] as const,
};

export const accessibleBusinessesQueryOptions = (userId: string | null) =>
  queryOptions({
    queryKey: businessKeys.accessible(userId),
    queryFn: userId ? ({ signal }) => businessesService.getAccessible(signal) : skipToken,
    staleTime: 5 * 60_000,
  });

export function useBusinesses() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(accessibleBusinessesQueryOptions(userId ?? null));
}

export function useActiveBusiness() {
  const activeBusinessId = useBusinessStore((state) => state.activeBusinessId);
  const { data: businesses = [] } = useBusinesses();

  return businesses.find((business) => business.id === activeBusinessId) ?? null;
}
