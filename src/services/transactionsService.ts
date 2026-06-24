import { supabase } from "@/lib/supabase";
import type { TransactionWithRelations, TransactionCreateInput } from "@/types/index";
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

  createMany: async (businessId: string, payload: TransactionCreateInput[]): Promise<TransactionWithRelations[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .insert(payload.map((transaction) => ({ ...transaction, business_id: businessId })))
      .select(TRANSACTION_SELECT);

    if (error) throw new Error(error.message);
    return data;
  },
};
