import { supabase } from "@/lib/supabase";
import { toServiceError } from "@/lib/errors";
import type { CashClose, CashCloseSummary, CashCloseWithRelations, UnclosedCashCloseDay } from "@/types/index";
import type { Database } from "@/types/supabase";
import { readAllPages } from "./readAllPages";

const CASH_CLOSE_SELECT = "*, users(fullname), cash_close_previous_versions(id, closed_at, users(fullname))" as const;

type SummaryRow = Database["public"]["Functions"]["get_cash_close_summary"]["Returns"][number];

function toCashCloseSummary(summary: SummaryRow): CashCloseSummary {
  return {
    billedOperations: summary.billed_operations,
    units: summary.total_units_sold,
    totalUsd: summary.total_usd,
    totalVes: summary.total_ves,
    returnsCount: summary.total_returns,
    returnsCreditUsd: summary.total_returns_usd,
    returnsCreditVes: summary.total_returns_ves,
    netUsd: summary.net_usd,
    netVes: summary.net_ves,
    casheaReceivableUsd: summary.cashea_receivable_usd,
    casheaReceivableVes: summary.cashea_receivable_ves,
    casheaVoidedReturnUsd: summary.cashea_voided_return_usd,
    casheaVoidedReturnVes: summary.cashea_voided_return_ves,
  };
}

export const cashClosesService = {
  /** Solo el día consultado. Un cierre guardado excluye operaciones registradas después de cerrarlo. */
  getLedgerReturns: async (businessId: string, date: string, closedAt?: string) => {
    const query = supabase
      .from("returns")
      .select("type, credit_usd, credit_ves, transactions(quantity, total_usd, total_ves)")
      .eq("business_id", businessId)
      .eq("date", date)
      .order("id");
    if (closedAt) query.lte("created_at", closedAt);

    return readAllPages(query);
  },

  getAll: async (businessId: string, date?: string): Promise<CashCloseWithRelations[]> => {
    let query = supabase
      .from("cash_closes")
      .select(CASH_CLOSE_SELECT)
      .eq("business_id", businessId)
      .order("date", { ascending: false })
      .order("id", { referencedTable: "cash_close_previous_versions" });

    if (date) query = query.eq("date", date);

    const { data, error } = await query;

    if (error) throw toServiceError(error);
    return data;
  },

  getSummary: async (businessId: string, date?: string): Promise<CashCloseSummary> => {
    const { data, error } = await supabase.rpc("get_cash_close_summary", {
      p_business_id: businessId,
      p_date: date,
    });

    if (error) throw toServiceError(error);

    const summary = data?.[0];
    if (!summary) throw new Error("No se pudo obtener el resumen del Cierre de Caja");

    return toCashCloseSummary(summary);
  },

  /** Días anteriores a hoy que tuvieron ventas y nadie cerró, del más reciente al más antiguo. */
  getUnclosedDays: async (businessId: string): Promise<UnclosedCashCloseDay[]> => {
    const { data, error } = await supabase.rpc("get_unclosed_cash_close_days", {
      p_business_id: businessId,
    });

    if (error) throw toServiceError(error);

    return (data ?? []).map(({ date, ...summary }) => ({ date, summary: toCashCloseSummary(summary) }));
  },

  generateDailyCashClose: async (businessId: string): Promise<CashClose> => {
    const { data, error } = await supabase.rpc("generate_daily_cash_close", {
      p_business_id: businessId,
    });

    if (error) throw toServiceError(error);
    return data;
  },
};
