import { supabase } from "@/lib/supabase";
import type { CashClose, CashCloseWithRelations } from "@/types/index";

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

  generateDailyCashClose: async (businessId: string): Promise<CashClose> => {
    const { data, error } = await supabase.rpc("generate_daily_cash_close", {
      p_business_id: businessId,
    });

    if (error) throw new Error(error.message);
    return data;
  },
};
