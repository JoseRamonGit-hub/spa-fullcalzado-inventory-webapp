import { supabase } from "@/lib/supabase";
import { toServiceError } from "@/lib/errors";
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

    if (error) throw toServiceError(error);
    return data;
  },

  create: async (businessId: string, payload: ExchangeRateCreateInput): Promise<ExchangeRate> => {
    const { data, error } = await supabase
      .from("exchange_rates")
      .insert({ ...payload, business_id: businessId })
      .select()
      .single();

    if (error) throw toServiceError(error);
    return data;
  },

  getHistory: async (businessId: string, limit = 15): Promise<ExchangeRate[]> => {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw toServiceError(error);
    return data;
  },
};
