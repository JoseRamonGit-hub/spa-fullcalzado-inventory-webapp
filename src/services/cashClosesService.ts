import { supabase } from "@/lib/supabase";
import type { CashClose } from "@/types/index";

export const cashClosesService = {
  getAll: async (): Promise<CashClose[]> => {
    const { data, error } = await supabase.from("cash_closes").select("*").order("date", { ascending: false });

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
