import { supabase } from "@/lib/supabase";
import type { Business } from "@/types";

export const businessesService = {
  getAccessible: async (signal?: AbortSignal): Promise<Business[]> => {
    let query = supabase.from("businesses").select("*").order("name", { ascending: true });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
  },
};
