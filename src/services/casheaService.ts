import { supabase } from "@/lib/supabase";
import { toServiceError } from "@/lib/errors";
import type {
  CasheaOrder,
  CasheaOrderAdjustment,
  CasheaOrderInput,
  CasheaOrderVoid,
  CasheaOrdersFilter,
} from "@/types";

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

  getSaleTotalUsd: async (businessId: string, saleId: string): Promise<number> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("total_usd")
      .eq("business_id", businessId)
      .eq("sale_id", saleId);

    if (error) throw toServiceError(error);
    return data.reduce((totalCents, line) => totalCents + Math.round((line.total_usd ?? 0) * 100), 0) / 100;
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

  adjustOrder: async (businessId: string, { orderId, order, note }: CasheaOrderAdjustment): Promise<void> => {
    const { error } = await supabase.rpc("adjust_cashea_order", {
      p_business_id: businessId,
      p_order_id: orderId,
      p_order_number: order.order_number,
      p_invoice_number: order.invoice_number,
      p_total_usd: order.total_usd,
      p_paid_today_usd: order.paid_today_usd,
      p_financed_usd: order.financed_usd,
      p_note: note,
    });

    if (error) throw toServiceError(error);
  },
};
