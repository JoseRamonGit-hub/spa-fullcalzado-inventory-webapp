import { supabase } from "@/lib/supabase";
import type { TransactionWithRelations, TransactionInsert } from "@/types/index";

const TRANSACTION_SELECT = "*, products(code, description), users(fullname)" as const;

export const transactionsService = {
  // 1. Histórico General (Idealmente después le agregaremos paginación o un límite)
  getAll: async (): Promise<TransactionWithRelations[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(500);

    if (error) throw new Error(error.message);
    return data as unknown as TransactionWithRelations[];
  },

  getToday: async (): Promise<TransactionWithRelations[]> => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Caracas" });

    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("date", today)
      .order("time", { ascending: false });

    if (error) throw new Error(error.message);
    return data as unknown as TransactionWithRelations[];
  },

  create: async (payload: TransactionInsert): Promise<TransactionWithRelations> => {
    const { data, error } = await supabase.from("transactions").insert(payload).select(TRANSACTION_SELECT).single();

    if (error) throw new Error(error.message);
    return data as unknown as TransactionWithRelations;
  },
};
