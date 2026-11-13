import { supabase } from "@/lib/supabase";
import { toServiceError } from "@/lib/errors";
import type { ProcessSalePayload, TransactionWithRelations } from "@/types/index";
import type { Json } from "@/types/supabase";
import { formatDateForBackend } from "@/utils/formatters";

const TRANSACTION_SELECT =
  "*, products(code, description), users(fullname), sales(cashea_orders(order_number, status))" as const;

export const transactionsService = {
  getAll: async (businessId: string, date?: string): Promise<TransactionWithRelations[]> => {
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
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

    if (error) throw toServiceError(error);
    return data;
  },

  getToday: async (businessId: string): Promise<TransactionWithRelations[]> => {
    const today = formatDateForBackend(new Date());

    const { data, error } = await supabase
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("business_id", businessId)
      .eq("date", today)
      .order("time", { ascending: false });

    if (error) throw toServiceError(error);
    return data;
  },

  /** Registra la Venta; con `p_cashea` la registra como Venta Cashea junto con su Orden Cashea. */
  createSale: async (businessId: string, payload: ProcessSalePayload): Promise<void> => {
    const saleArgs = {
      p_business_id: businessId,
      p_items: payload.p_items as Json,
      p_exchange_rate: payload.p_exchange_rate,
    };

    const { error } = payload.p_cashea
      ? await supabase.rpc("create_cashea_sale", { ...saleArgs, p_cashea: payload.p_cashea as Json })
      : await supabase.rpc("create_sale", saleArgs);

    if (error) throw toServiceError(error);
  },
};
