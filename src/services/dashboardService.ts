import { supabase } from "@/lib/supabase";
import type { DashboardDailyMetrics, DashboardSalesPeriod, DashboardSalesPeriodRequest } from "@/types";

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
};
