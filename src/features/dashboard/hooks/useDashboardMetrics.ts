import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { dashboardService } from "@/services/dashboardService";
import type { DashboardSalesPeriodPreset } from "@/types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  business: (businessId: string | null) => [...dashboardKeys.all, businessId] as const,
  dailyMetrics: (businessId: string | null) => [...dashboardKeys.business(businessId), "daily-metrics"] as const,
  salesPeriod: (businessId: string | null, preset: DashboardSalesPeriodPreset) =>
    [...dashboardKeys.business(businessId), "sales-period", preset] as const,
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

export function useDashboardSalesPeriod(preset: DashboardSalesPeriodPreset) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: dashboardKeys.salesPeriod(businessId, preset),
    queryFn: businessId ? ({ signal }) => dashboardService.getSalesPeriod(businessId, preset, signal) : skipToken,
    staleTime: 30_000,
  });
}
