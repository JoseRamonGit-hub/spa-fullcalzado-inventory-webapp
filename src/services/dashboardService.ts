import { supabase } from "@/lib/supabase";
import type {
  DashboardDailyMetrics,
  DashboardSalesPeriod,
  DashboardSalesPeriodRequest,
  DashboardTopProduct,
  DashboardTopProductsRankMode,
  DashboardProductStockAlert,
  ProductStockAlertType,
} from "@/types";

export const dashboardService = {
  getDailyMetrics: async (businessId: string, signal?: AbortSignal): Promise<DashboardDailyMetrics> => {
    let query = supabase.rpc("get_dashboard_daily_metrics", { p_business_id: businessId });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.single();

    if (error) throw new Error(error.message);
    return data;
  },
  getSalesPeriod: async (
    businessId: string,
    request: DashboardSalesPeriodRequest,
    signal?: AbortSignal,
  ): Promise<DashboardSalesPeriod> => {
    let query = supabase.rpc("get_dashboard_sales_period", {
      p_business_id: businessId,
      p_period: request.preset,
      p_start_date: request.preset === "custom" ? request.startDate : undefined,
      p_end_date: request.preset === "custom" ? request.endDate : undefined,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    const summary = data[0];
    if (!summary) throw new Error("El servidor no devolvió el período de facturación");

    return {
      preset: request.preset,
      currentStart: summary.current_start,
      currentEnd: summary.current_end,
      comparisonStart: summary.comparison_start,
      comparisonEnd: summary.comparison_end,
      totalUsd: summary.current_total_usd,
      previousTotalUsd: summary.previous_total_usd,
      operations: summary.current_operations,
      previousOperations: summary.previous_operations,
      averageTicketUsd: summary.average_ticket_usd,
      buckets: data.map((bucket) => ({
        index: bucket.bucket_index,
        label: bucket.bucket_label,
        startDate: bucket.bucket_start,
        endDate: bucket.bucket_end,
        isAvailable: bucket.is_available,
        totalUsd: bucket.bucket_total_usd,
      })),
    };
  },
  getTopProducts: async (
    businessId: string,
    request: DashboardSalesPeriodRequest,
    rankBy: DashboardTopProductsRankMode,
    signal?: AbortSignal,
  ): Promise<DashboardTopProduct[]> => {
    let query = supabase.rpc("get_dashboard_top_products", {
      p_business_id: businessId,
      p_period: request.preset,
      p_rank_by: rankBy,
      p_start_date: request.preset === "custom" ? request.startDate : undefined,
      p_end_date: request.preset === "custom" ? request.endDate : undefined,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data.map((product) => ({
      rank: product.rank,
      productId: product.product_id,
      code: product.code,
      description: product.description,
      units: product.units,
      grossUsd: product.gross_usd,
    }));
  },
  getProductStockAlerts: async (
    businessId: string,
    type: ProductStockAlertType,
    signal?: AbortSignal,
  ): Promise<DashboardProductStockAlert[]> => {
    let query = supabase.rpc("get_product_stock_alerts", {
      p_business_id: businessId,
      p_alert_type: type,
      p_limit: 5,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data.map((product) => ({
      type: product.alert_type as ProductStockAlertType,
      rank: product.alert_rank,
      productId: product.product_id,
      code: product.code,
      description: product.description,
      stock: product.stock,
      active: product.active,
      stagnantSince: product.stagnant_since,
      stagnantDays: product.stagnant_days,
    }));
  },
};
