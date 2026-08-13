import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { DashboardServiceError, dashboardService } from "@/services/dashboardService";
import type { DashboardSalesPeriodRequest, DashboardTopProductsRankMode, ProductStockAlertType } from "@/types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  business: (businessId: string | null) => [...dashboardKeys.all, businessId] as const,
  dailyMetrics: (businessId: string | null) => [...dashboardKeys.business(businessId), "daily-metrics"] as const,
  salesPeriod: (businessId: string | null, request: DashboardSalesPeriodRequest | null) =>
    [...dashboardKeys.business(businessId), "sales-period", request] as const,
  topProducts: (
    businessId: string | null,
    request: DashboardSalesPeriodRequest | null,
    rankBy: DashboardTopProductsRankMode,
  ) => [...dashboardKeys.business(businessId), "top-products", request, rankBy] as const,
  productStockAlerts: (businessId: string | null, type: ProductStockAlertType) =>
    [...dashboardKeys.business(businessId), "product-stock-alerts", type] as const,
};

function retryDashboardQuery(failureCount: number, error: unknown) {
  if (error instanceof DashboardServiceError && (error.kind === "access" || error.kind === "invalid-response")) {
    return false;
  }

  return failureCount < 2;
}

const dashboardMetricsQueryOptions = (businessId: string | null) =>
  queryOptions({
    queryKey: dashboardKeys.dailyMetrics(businessId),
    queryFn: businessId ? ({ signal }) => dashboardService.getDailyMetrics(businessId, signal) : skipToken,
    staleTime: 30_000,
    retry: retryDashboardQuery,
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
    retry: retryDashboardQuery,
  });
}

export function useDashboardTopProducts(
  request: DashboardSalesPeriodRequest | null,
  rankBy: DashboardTopProductsRankMode,
) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: dashboardKeys.topProducts(businessId, request, rankBy),
    queryFn:
      businessId && request
        ? ({ signal }) => dashboardService.getTopProducts(businessId, request, rankBy, signal)
        : skipToken,
    staleTime: 30_000,
    retry: retryDashboardQuery,
  });
}

export function useDashboardProductStockAlerts(type: ProductStockAlertType) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: dashboardKeys.productStockAlerts(businessId, type),
    queryFn: businessId ? ({ signal }) => dashboardService.getProductStockAlerts(businessId, type, signal) : skipToken,
    staleTime: 30_000,
    retry: retryDashboardQuery,
  });
}
