import { supabase } from "@/lib/supabase";
import { toServiceError } from "@/lib/errors";
import type { CasheaOrder, CasheaOrderInput, CasheaOrderVoid, CasheaOrdersFilter } from "@/types";

export const casheaService = {
  getOrders: async (businessId: string, filter: CasheaOrdersFilter): Promise<CasheaOrder[]> => {
    let query = supabase
      .from("cashea_orders")
      .select("*")
      .eq("business_id", businessId)
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filter.status) query = query.eq("status", filter.status);
    if (filter.from) query = query.gte("sale_date", filter.from);
    if (filter.to) query = query.lte("sale_date", filter.to);

    const { data, error } = await query;

    if (error) throw toServiceError(error);
    return data;
  },

  attachOrder: async (businessId: string, saleId: string, order: CasheaOrderInput): Promise<string> => {
    const { data, error } = await supabase.rpc("attach_cashea_order", {
      p_business_id: businessId,
      p_sale_id: saleId,
      p_cashea: order,
    });

    if (error) throw toServiceError(error);
    return data;
  },

  voidOrder: async (businessId: string, { orderId, reason, note }: CasheaOrderVoid): Promise<void> => {
    const { error } = await supabase.rpc("void_cashea_order", {
      p_business_id: businessId,
      p_order_id: orderId,
      p_reason: reason,
      p_note: note,
    });

    if (error) throw toServiceError(error);
  },
};
