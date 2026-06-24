import { supabase } from "@/lib/supabase";
import type { ProcessReturnPayload, Return, ReturnWithRelations } from "@/types/index";
import type { Json } from "@/types/supabase";
import { formatDateForBackend } from "@/utils/formatters";

const RETURN_WITH_RELATIONS_SELECT =
  "*, users(fullname), return_items(*, products(code, description)), transactions(*, products(code, description))" as const;

export const returnsService = {
  getToday: async (businessId: string): Promise<Return[]> => {
    const today = formatDateForBackend(new Date());
    const { data, error } = await supabase
      .from("returns")
      .select("*")
      .eq("business_id", businessId)
      .eq("date", today)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  getAll: async (businessId: string, date?: string): Promise<ReturnWithRelations[]> => {
    let query = supabase
      .from("returns")
      .select(RETURN_WITH_RELATIONS_SELECT)
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
    return data as ReturnWithRelations[];
  },

  processReturn: async (businessId: string, payload: ProcessReturnPayload): Promise<void> => {
    const { error } = await supabase.rpc("process_return", {
      p_business_id: businessId,
      p_type: payload.p_type,
      p_returned_items: payload.p_returned_items as Json,
      p_new_items: (payload.p_new_items ?? undefined) as Json,
      p_exchange_rate: payload.p_exchange_rate,
      p_notes: payload.p_notes ?? undefined,
    });

    if (error) throw new Error(error.message);
  },
};
