import { skipToken, useQuery } from "@tanstack/react-query";
import { cashClosesService } from "@/services/cashClosesService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { formatDateForBackend } from "@/utils/formatters";
import type { CashCloseFigures } from "../cash-close-ledger";

export const cashCloseKeys = {
  all: ["cash-closes"] as const,
  business: (businessId: string | null) => [...cashCloseKeys.all, businessId] as const,
  lists: (businessId: string | null) => [...cashCloseKeys.business(businessId), "list"] as const,
  list: (businessId: string | null, date?: string) => [...cashCloseKeys.lists(businessId), { date }] as const,
  summaries: (businessId: string | null) => [...cashCloseKeys.business(businessId), "summary"] as const,
  summary: (businessId: string | null, date?: string) => [...cashCloseKeys.summaries(businessId), { date }] as const,
  unclosed: (businessId: string | null) => [...cashCloseKeys.business(businessId), "unclosed"] as const,
};

export function useCashCloses(date?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: cashCloseKeys.list(businessId, date),
    queryFn: businessId ? () => cashClosesService.getAll(businessId, date) : skipToken,
  });
}

export function useCashCloseSummary(date?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: cashCloseKeys.summary(businessId, date),
    queryFn: businessId ? () => cashClosesService.getSummary(businessId, date) : skipToken,
    refetchInterval: !date || date === formatDateForBackend(new Date()) ? 30_000 : false,
  });
}

export function useLedgerReturns(date: string, figures: CashCloseFigures, closedAt?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  return useQuery({
    queryKey: [
      ...cashCloseKeys.summaries(businessId),
      "ledger-returns",
      date,
      closedAt,
      figures.returnsCount,
      figures.returnsCredit,
    ],
    queryFn:
      businessId && figures.returnsCount > 0
        ? () => cashClosesService.getLedgerReturns(businessId, date, closedAt)
        : skipToken,
  });
}

export function useLedgerCasheaOrders(
  date: string,
  receivable: CashCloseFigures["casheaReceivable"],
  closedAt?: string,
) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  return useQuery({
    queryKey: [...cashCloseKeys.summaries(businessId), "ledger-cashea", date, closedAt, receivable],
    queryFn:
      businessId && (receivable.usd !== 0 || receivable.ves !== 0)
        ? () => cashClosesService.getLedgerCasheaOrders(businessId, date, closedAt)
        : skipToken,
  });
}

/** Siempre todos: el historial filtra por fecha y el panel cuenta los que quedaron tras el último cierre. */
export function useUnclosedCashCloseDays() {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: cashCloseKeys.unclosed(businessId),
    queryFn: businessId ? () => cashClosesService.getUnclosedDays(businessId) : skipToken,
  });
}
