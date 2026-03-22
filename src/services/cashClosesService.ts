import { supabase } from "@/lib/supabase";
import type { CashClose, CashCloseWithRelations } from "@/types/index";

const CASH_CLOSE_SELECT = "*, users(fullname)" as const;

export const cashClosesService = {
  getAll: async (date?: string): Promise<CashCloseWithRelations[]> => {
    let query = supabase.from("cash_closes").select(CASH_CLOSE_SELECT).order("date", { ascending: false });

    if (date) query = query.eq("date", date);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },

  generateDailyCashClose: async (userId: string): Promise<CashClose> => {
    const { data, error } = await supabase.rpc("generate_daily_cash_close", {
      p_user_id: userId,
    });

    if (error) throw new Error(error.message);
    return data;
  },
};
