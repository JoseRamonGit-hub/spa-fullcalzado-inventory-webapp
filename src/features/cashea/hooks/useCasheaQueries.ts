import { skipToken, useQuery } from "@tanstack/react-query";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { casheaService } from "@/services/casheaService";
import type { CasheaOrdersFilter } from "@/types";

/** Claves de las consultas Cashea del negocio activo. */
export const casheaKeys = {
  all: ["cashea"] as const,
  business: (businessId: string | null) => [...casheaKeys.all, businessId] as const,
  orders: (businessId: string | null) => [...casheaKeys.business(businessId), "orders"] as const,
  orderList: (businessId: string | null, filter: CasheaOrdersFilter) =>
    [...casheaKeys.orders(businessId), filter] as const,
};

/** Cuentas por cobrar Cashea del negocio activo; cambiar de negocio cambia la clave y reemplaza la lista. */
export function useCasheaOrders(filter: CasheaOrdersFilter) {
  const businessId = useBusinessStore((state) => state.activeBusinessId);

  return useQuery({
    queryKey: casheaKeys.orderList(businessId, filter),
    queryFn: businessId ? () => casheaService.getOrders(businessId, filter) : skipToken,
  });
}
