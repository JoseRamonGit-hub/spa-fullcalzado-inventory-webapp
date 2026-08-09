import { supabase } from "@/lib/supabase";
import type { ProcessSalePayload, TransactionWithRelations } from "@/types/index";
import type { Json } from "@/types/supabase";
import { formatDateForBackend } from "@/utils/formatters";

const TRANSACTION_SELECT = "*, products(code, description), users(fullname)" as const;

export const transactionsService = {
  getAll: async (businessId: string, date?: string): Promise<TransactionWithRelations[]> => {
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (date) {
      query = query.eq("date", date);
    } else {
      // Default: last 30 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      query = query.gte("date", formatDateForBackend(cutoff));
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },

  getToday: async (businessId: string): Promise<TransactionWithRelations[]> => {
    const today = formatDateForBackend(new Date());

    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("business_id", businessId)
      .eq("date", today)
      .order("time", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  createSale: async (businessId: string, payload: ProcessSalePayload): Promise<void> => {
    const { error } = await supabase.rpc("create_sale", {
      p_business_id: businessId,
      p_items: payload.p_items as Json,
      p_exchange_rate: payload.p_exchange_rate,
    });

    if (error) throw new Error(error.message);
  },
};
