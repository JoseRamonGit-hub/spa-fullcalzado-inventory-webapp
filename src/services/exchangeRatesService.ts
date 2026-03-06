import { supabase } from "@/lib/supabase"
import type { ExchangeRate, ExchangeRateInsert, ExchangeRateUpdate } from "@/types/index"

export const exchangeRatesService = {
  getCurrent: async (): Promise<ExchangeRate> => {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  create: async (payload: ExchangeRateInsert): Promise<ExchangeRate> => {
    const { data, error } = await supabase.from("exchange_rates").insert(payload).select().single()

    if (error) throw new Error(error.message)
    return data
  },

  update: async (id: string, payload: ExchangeRateUpdate): Promise<ExchangeRate> => {
    const { data, error } = await supabase.from("exchange_rates").update(payload).eq("id", id).select().single()

    if (error) throw new Error(error.message)
    return data
  },
}
