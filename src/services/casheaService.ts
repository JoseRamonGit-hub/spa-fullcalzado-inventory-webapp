import { supabase } from "@/lib/supabase";
import { toServiceError } from "@/lib/errors";
import type {
  CasheaCollectionStatus,
  CasheaDepositInput,
  CasheaDepositReversal,
  CasheaDepositWithOrders,
  CasheaOrder,
  CasheaOrderAdjustment,
  CasheaOrderInput,
  CasheaOrderVoid,
  CasheaOrdersFilter,
  CasheaReceivableSummary,
  CasheaSettings,
  CasheaSettingsUpdate,
} from "@/types";

const DEFAULT_CASHEA_SETTINGS: CasheaSettings = { serviceFeePct: 4, advanceFeePct: 4 };

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

  getCollectionStatus: async (businessId: string, date?: string): Promise<CasheaCollectionStatus[]> => {
    const { data, error } = await supabase.rpc("get_cashea_collection_status", {
      p_business_id: businessId,
      p_from: date,
      p_to: date,
    });

    if (error) throw toServiceError(error);
    return data;
  },

  getReceivableSummary: async (businessId: string, signal?: AbortSignal): Promise<CasheaReceivableSummary> => {
    let query = supabase.rpc("get_cashea_receivable_summary", { p_business_id: businessId });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query.single();

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

  getDeposit: async (businessId: string, depositId: string): Promise<CasheaDepositWithOrders> => {
    const { data, error } = await supabase
      .from("cashea_deposits")
      .select("*, cashea_orders(order_number)")
      .eq("business_id", businessId)
      .eq("id", depositId)
      .single();

    if (error) throw toServiceError(error);
    return data;
  },

  registerDeposit: async (businessId: string, deposit: CasheaDepositInput): Promise<string> => {
    const { data, error } = await supabase.rpc("register_cashea_deposit", {
      p_business_id: businessId,
      p_order_ids: deposit.orderIds,
      p_received_ves: deposit.receivedVes,
      p_deposit_date: deposit.depositDate,
      p_applied_rate: deposit.appliedRate ?? undefined,
      p_reference: deposit.reference ?? undefined,
    });

    if (error) throw toServiceError(error);
    return data;
  },

  revertDeposit: async (businessId: string, { depositId, note }: CasheaDepositReversal): Promise<void> => {
    const { error } = await supabase.rpc("revert_cashea_deposit", {
      p_business_id: businessId,
      p_deposit_id: depositId,
      p_note: note,
    });

    if (error) throw toServiceError(error);
  },

  getSettings: async (businessId: string): Promise<CasheaSettings> => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("cashea_service_fee_pct, cashea_advance_fee_pct")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw toServiceError(error);
    if (!data) return DEFAULT_CASHEA_SETTINGS;
    return { serviceFeePct: data.cashea_service_fee_pct, advanceFeePct: data.cashea_advance_fee_pct };
  },

  updateSettings: async (
    businessId: string,
    { serviceFeePct, advanceFeePct, applyToPending }: CasheaSettingsUpdate,
  ): Promise<number> => {
    const { data, error } = await supabase.rpc("update_cashea_settings", {
      p_business_id: businessId,
      p_service_fee_pct: serviceFeePct,
      p_advance_fee_pct: advanceFeePct,
      p_apply_to_pending: applyToPending,
    });

    if (error) throw toServiceError(error);
    return data;
  },
};
