import { supabase } from "@/lib/supabase";
import type { TransactionWithRelations, TransactionInsert } from "@/types/index";
import { formatDateForBackend } from "@/utils/formatters";

const TRANSACTION_SELECT = "*, products(code, description), users(fullname)" as const;

export const transactionsService = {
  getAll: async (date?: string): Promise<TransactionWithRelations[]> => {
    let query = supabase.from("transactions").select(TRANSACTION_SELECT).order("created_at", { ascending: false });

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

  getToday: async (): Promise<TransactionWithRelations[]> => {
    const today = formatDateForBackend(new Date());

    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("date", today)
      .order("time", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  create: async (payload: TransactionInsert): Promise<TransactionWithRelations> => {
    const { data, error } = await supabase.from("transactions").insert(payload).select(TRANSACTION_SELECT).single();

    if (error) throw new Error(error.message);
    return data;
  },

  createMany: async (payload: TransactionInsert[]): Promise<TransactionWithRelations[]> => {
    const { data, error } = await supabase.from("transactions").insert(payload).select(TRANSACTION_SELECT);

    if (error) throw new Error(error.message);
    return data;
  },
};
