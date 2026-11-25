import { skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { casheaService } from "@/services/casheaService";
import type { CalendarDateRange, CasheaOrder, CasheaOrdersFilter } from "@/types";
import { formatDateForBackend } from "@/utils/formatters";
import { casheaStatusFilters, resolveCasheaOrdersFilter, type CasheaStatusFilter } from "../cashea-receivables";

export const casheaKeys = {
  all: ["cashea"] as const,
  business: (businessId: string | null) => [...casheaKeys.all, businessId] as const,
  orders: (businessId: string | null) => [...casheaKeys.business(businessId), "orders"] as const,
  orderList: (businessId: string | null, filter: CasheaOrdersFilter) =>
    [...casheaKeys.orders(businessId), filter] as const,
  orderDetail: (businessId: string | null, orderId?: string) =>
    [...casheaKeys.orders(businessId), "detail", orderId] as const,
  cashCloseOrders: (businessId: string | null, date?: string, closedAt?: string) =>
    [...casheaKeys.orders(businessId), "cash-close", { date, closedAt }] as const,
  orderCounts: (businessId: string | null, filters: Record<CasheaStatusFilter, CasheaOrdersFilter>) =>
    [...casheaKeys.orders(businessId), "counts", filters] as const,
  collectionStatus: (businessId: string | null, date?: string) =>
    [...casheaKeys.business(businessId), "collection-status", { date }] as const,
  saleTotal: (businessId: string | null, saleId: string) =>
    [...casheaKeys.business(businessId), "sale-total", saleId] as const,
  deposit: (businessId: string | null, depositId: string) =>
    [...casheaKeys.business(businessId), "deposit", depositId] as const,
  settings: (businessId: string | null) => [...casheaKeys.business(businessId), "settings"] as const,
};

export function useCasheaOrder(orderId?: string, listOrder?: CasheaOrder) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.orderDetail(businessId, orderId),
    queryFn: businessId && orderId ? ({ signal }) => casheaService.getOrder(businessId, orderId, signal) : skipToken,
    placeholderData: listOrder,
  });
}

export function useCasheaOrders(filter: CasheaOrdersFilter, enabled = true) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.orderList(businessId, filter),
    queryFn: businessId ? () => casheaService.getOrders(businessId, filter) : skipToken,
    enabled,
  });
}

export function useCasheaOrdersForCashClose(date?: string, closedAt?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.cashCloseOrders(businessId, date, closedAt),
    queryFn: businessId && date ? () => casheaService.getOrdersForCashClose(businessId, date, closedAt) : skipToken,
    refetchInterval: !closedAt && date === formatDateForBackend(new Date()) ? 30_000 : false,
  });
}

/** Órdenes de cada pestaña de estado, cada una con el periodo que aplicaría al elegirla. */
export function useCasheaOrderCounts(range: CalendarDateRange, enabled = true) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  const filters = Object.fromEntries(
    casheaStatusFilters.map((status) => [status, resolveCasheaOrdersFilter({ ...range, status })]),
  ) as Record<CasheaStatusFilter, CasheaOrdersFilter>;

  return useQuery({
    queryKey: casheaKeys.orderCounts(businessId, filters),
    queryFn: businessId ? () => casheaService.getOrderCounts(businessId, filters) : skipToken,
    enabled,
  });
}

export function useCasheaCollectionStatus(date?: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.collectionStatus(businessId, date),
    queryFn: businessId ? () => casheaService.getCollectionStatus(businessId, date) : skipToken,
  });
}

export function useCasheaSaleTotal(saleId: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.saleTotal(businessId, saleId),
    queryFn: businessId ? () => casheaService.getSaleTotalUsd(businessId, saleId) : skipToken,
  });
}

export function useCasheaDeposit(depositId: string) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.deposit(businessId, depositId),
    queryFn: businessId ? () => casheaService.getDeposit(businessId, depositId) : skipToken,
  });
}

export function useCasheaSettings() {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.settings(businessId),
    queryFn: businessId ? () => casheaService.getSettings(businessId) : skipToken,
  });
}
