import { supabase } from "@/lib/supabase";
import type { ProcessReturnPayload, Return, ReturnWithRelations } from "@/types/index";
import type { Json } from "@/types/supabase";
import { formatDateForBackend } from "@/utils/formatters";

const RETURN_WITH_RELATIONS_SELECT =
  "*, users(fullname), return_items(*, products(code, description)), transactions(*, products(code, description))" as const;

export const returnsService = {
  getToday: async (): Promise<Return[]> => {
    const today = formatDateForBackend(new Date());
    const { data, error } = await supabase
      .from("returns")
      .select("*")
      .eq("date", today)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  getAll: async (date?: string): Promise<ReturnWithRelations[]> => {
    let query = supabase.from("returns").select(RETURN_WITH_RELATIONS_SELECT).order("created_at", { ascending: false });

    if (date) {
      query = query.eq("date", date);
    } else {
      query = query.limit(200);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data as unknown as ReturnWithRelations[];
  },

  processReturn: async (payload: ProcessReturnPayload) => {
    const { data, error } = await supabase.rpc("process_return", {
      p_type: payload.p_type,
      p_returned_items: payload.p_returned_items as unknown as Json,
      p_new_items: (payload.p_new_items ?? undefined) as unknown as Json,
      p_exchange_rate: payload.p_exchange_rate,
      p_user_id: payload.p_user_id,
      p_notes: payload.p_notes ?? undefined,
    });

    if (error) throw new Error(error.message);
    return data;
  },
};
