import { supabase } from "@/lib/supabase";
import type { ProcessReturnPayload } from "@/types/index";
import type { Json } from "@/types/supabase";

export const returnsService = {
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
