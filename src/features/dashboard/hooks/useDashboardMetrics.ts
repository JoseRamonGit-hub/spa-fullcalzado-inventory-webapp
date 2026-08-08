import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { dashboardService } from "@/services/dashboardService";
import type { DashboardSalesPeriodRequest } from "@/types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  business: (businessId: string | null) => [...dashboardKeys.all, businessId] as const,
  dailyMetrics: (businessId: string | null) => [...dashboardKeys.business(businessId), "daily-metrics"] as const,
  salesPeriod: (businessId: string | null, request: DashboardSalesPeriodRequest | null) =>
    [...dashboardKeys.business(businessId), "sales-period", request] as const,
};

const dashboardMetricsQueryOptions = (businessId: string | null) =>
  queryOptions({
    queryKey: dashboardKeys.dailyMetrics(businessId),
    queryFn: businessId ? ({ signal }) => dashboardService.getDailyMetrics(businessId, signal) : skipToken,
    staleTime: 30_000,
  });

export function useDashboardMetrics() {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery(dashboardMetricsQueryOptions(businessId));
}

export function useDashboardSalesPeriod(request: DashboardSalesPeriodRequest | null) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: dashboardKeys.salesPeriod(businessId, request),
    queryFn:
      businessId && request ? ({ signal }) => dashboardService.getSalesPeriod(businessId, request, signal) : skipToken,
    staleTime: 30_000,
  });
}
