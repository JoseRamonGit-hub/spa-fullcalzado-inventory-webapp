import { skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { casheaService } from "@/services/casheaService";
import type { CasheaOrdersFilter } from "@/types";

export const casheaKeys = {
  all: ["cashea"] as const,
  business: (businessId: string | null) => [...casheaKeys.all, businessId] as const,
  orders: (businessId: string | null) => [...casheaKeys.business(businessId), "orders"] as const,
  orderList: (businessId: string | null, filter: CasheaOrdersFilter) =>
    [...casheaKeys.orders(businessId), filter] as const,
  collectionStatus: (businessId: string | null, date?: string) =>
    [...casheaKeys.business(businessId), "collection-status", { date }] as const,
  saleTotal: (businessId: string | null, saleId: string) =>
    [...casheaKeys.business(businessId), "sale-total", saleId] as const,
  settings: (businessId: string | null) => [...casheaKeys.business(businessId), "settings"] as const,
};

export function useCasheaOrders(filter: CasheaOrdersFilter) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.orderList(businessId, filter),
    queryFn: businessId ? () => casheaService.getOrders(businessId, filter) : skipToken,
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

export function useCasheaSettings() {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.settings(businessId),
    queryFn: businessId ? () => casheaService.getSettings(businessId) : skipToken,
  });
}
