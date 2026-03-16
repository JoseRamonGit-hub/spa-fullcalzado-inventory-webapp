import { supabase } from "@/lib/supabase";
import type { CashClose } from "@/types/index";

export const cashClosesService = {
  getAll: async (date?: string): Promise<CashClose[]> => {
    let query = supabase.from("cash_closes").select("*").order("date", { ascending: false });

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
