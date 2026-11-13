import { supabase } from "@/lib/supabase";
import { toServiceError } from "@/lib/errors";
import type { CasheaOrder, CasheaOrderInput, CasheaOrdersFilter } from "@/types";

export const casheaService = {
  /** Órdenes Cashea del negocio, de la venta más reciente a la más antigua. */
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
};
