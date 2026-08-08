import { supabase } from "@/lib/supabase";
import type { DashboardDailyMetrics } from "@/types";

export const dashboardService = {
  getDailyMetrics: async (businessId: string, signal?: AbortSignal): Promise<DashboardDailyMetrics> => {
    let query = supabase.rpc("get_dashboard_daily_metrics", { p_business_id: businessId });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.single();

    if (error) throw new Error(error.message);
    return data;
  },
};
