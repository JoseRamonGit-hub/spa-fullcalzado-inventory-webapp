import { supabase } from "@/lib/supabase";
import type { ExchangeRate, ExchangeRateCreateInput } from "@/types/index";

export const exchangeRatesService = {
  getCurrent: async (businessId: string): Promise<ExchangeRate | null> => {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (businessId: string, payload: ExchangeRateCreateInput): Promise<ExchangeRate> => {
    const { data, error } = await supabase
      .from("exchange_rates")
      .insert({ ...payload, business_id: businessId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getHistory: async (businessId: string, limit = 15): Promise<ExchangeRate[]> => {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data;
  },
};
