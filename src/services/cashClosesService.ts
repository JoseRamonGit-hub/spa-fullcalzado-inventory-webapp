import { supabase } from "@/lib/supabase";
import type { CashClose, CashCloseSummary, CashCloseWithRelations } from "@/types/index";

const CASH_CLOSE_SELECT = "*, users(fullname)" as const;

export const cashClosesService = {
  getAll: async (businessId: string, date?: string): Promise<CashCloseWithRelations[]> => {
    let query = supabase
      .from("cash_closes")
      .select(CASH_CLOSE_SELECT)
      .eq("business_id", businessId)
      .order("date", { ascending: false });

    if (date) query = query.eq("date", date);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },

  getSummary: async (businessId: string, date?: string): Promise<CashCloseSummary> => {
    const { data, error } = await supabase.rpc("get_cash_close_summary", {
      p_business_id: businessId,
      p_date: date,
    });

    if (error) throw new Error(error.message);

    const summary = data?.[0];
    if (!summary) throw new Error("No se pudo obtener el resumen del Cierre de Caja");

    return {
      billedOperations: summary.billed_operations,
      units: summary.total_units_sold,
      totalUsd: summary.total_usd,
      totalVes: summary.total_ves,
      returnsCount: summary.total_returns,
      returnsCreditUsd: summary.total_returns_usd,
      returnsCreditVes: summary.total_returns_ves,
      netUsd: summary.net_usd,
      netVes: summary.net_ves,
    };
  },

  generateDailyCashClose: async (businessId: string): Promise<CashClose> => {
    const { data, error } = await supabase.rpc("generate_daily_cash_close", {
      p_business_id: businessId,
    });

    if (error) throw new Error(error.message);
    return data;
  },
};
