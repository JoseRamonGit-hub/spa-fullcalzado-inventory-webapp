import type { CalendarDateRange, CasheaOrder, CasheaOrderStatus, CasheaOrdersFilter, CasheaVoidReason } from "@/types";
import { formatDateForBackend, formatInteger } from "@/utils/formatters";
import { normalizeSearchValue } from "@/utils/search";

export const casheaStatusFilters = ["pending", "collected", "voided", "all"] as const;

export type CasheaStatusFilter = (typeof casheaStatusFilters)[number];

export const DEFAULT_CASHEA_STATUS_FILTER: CasheaStatusFilter = "pending";

export const casheaStatusFilterLabels: Record<CasheaStatusFilter, string> = {
  pending: "Pendientes",
  collected: "Cobradas",
  voided: "Anuladas",
  all: "Todas",
};

export const casheaOrderStatusLabels: Record<CasheaOrderStatus, string> = {
  pending: "Pendiente",
  collected: "Cobrada",
  voided: "Anulada",
};

export const casheaOrderStatusBadgeVariants: Record<CasheaOrderStatus, "warning" | "success" | "secondary"> = {
  pending: "warning",
  collected: "success",
  voided: "secondary",
};

export const casheaVoidReasonLabels: Record<CasheaVoidReason, string> = {
  customer_return: "Devolución del cliente",
  registration_error: "Error de registro",
};

const DEFAULT_PERIOD_DAYS = 30;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isCalendarDate(value: string | undefined): value is string {
  if (!value || !datePattern.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function calendarDateToUtcTime(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function subtractCalendarDays(dateString: string, days: number) {
  const date = new Date(calendarDateToUtcTime(dateString));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export type CasheaOrdersSearch = CalendarDateRange & {
  status?: CasheaStatusFilter;
};

export function getCasheaDefaultPeriodLabel(status: CasheaStatusFilter) {
  return status === "pending" ? "Cualquier fecha" : `Últimos ${DEFAULT_PERIOD_DAYS} días`;
}

export function resolveCasheaOrdersFilter(
  search: CasheaOrdersSearch,
  today = formatDateForBackend(new Date()),
): CasheaOrdersFilter {
  const statusFilter = search.status ?? DEFAULT_CASHEA_STATUS_FILTER;
  const status = statusFilter === "all" ? null : statusFilter;
  let from = isCalendarDate(search.from) ? search.from : undefined;
  let to = isCalendarDate(search.to) ? search.to : undefined;

  if (from && to && from > to) [from, to] = [to, from];

  if (from || to) return { status, from, to };
  if (status === "pending") return { status };

  return { status, from: subtractCalendarDays(today, DEFAULT_PERIOD_DAYS) };
}

export function getCasheaOrderAgeDays(saleDate: string, today = formatDateForBackend(new Date())): number | null {
  if (!isCalendarDate(saleDate) || !isCalendarDate(today)) return null;

  return Math.round((calendarDateToUtcTime(today) - calendarDateToUtcTime(saleDate)) / 86_400_000);
}

export function formatCasheaAgeDays(days: number | null) {
  if (days == null) return "—";
  return `${formatInteger(days)} ${days === 1 ? "día" : "días"}`;
}

/** Desde esta Antigüedad una orden Pendiente se resalta: Cashea ya está tardando en depositarla. */
export const CASHEA_LATE_ORDER_DAYS = 15;

export function isCasheaOrderLate(order: Pick<CasheaOrder, "status">, ageDays: number | null) {
  return order.status === "pending" && ageDays != null && ageDays >= CASHEA_LATE_ORDER_DAYS;
}

/** Comisión Cashea de una orden: lo que separa el Monto financiado del Neto esperado. */
export function getCasheaCommissionUsd(order: Pick<CasheaOrder, "financed_usd" | "expected_net_usd">) {
  return (Math.round(order.financed_usd * 100) - Math.round(order.expected_net_usd * 100)) / 100;
}

export type CasheaOrdersTotals = {
  count: number;
  financedUsd: number;
  expectedNetUsd: number;
};

type SummableCasheaOrder = Pick<CasheaOrder, "status" | "financed_usd" | "expected_net_usd">;

/** Suma en centavos para que muchas órdenes no acumulen error de redondeo. */
export function sumCasheaOrders(orders: readonly SummableCasheaOrder[]): CasheaOrdersTotals {
  let financedCents = 0;
  let expectedNetCents = 0;

  for (const order of orders) {
    financedCents += Math.round(order.financed_usd * 100);
    expectedNetCents += Math.round(order.expected_net_usd * 100);
  }

  return { count: orders.length, financedUsd: financedCents / 100, expectedNetUsd: expectedNetCents / 100 };
}

export function getCasheaPendingSummary(orders: readonly SummableCasheaOrder[]): CasheaOrdersTotals {
  return sumCasheaOrders(orders.filter((order) => order.status === "pending"));
}

/** Busca por número de orden o de factura. */
export function searchCasheaOrders<TOrder extends Pick<CasheaOrder, "order_number" | "invoice_number">>(
  orders: TOrder[],
  search: string,
): TOrder[] {
  const query = normalizeSearchValue(search);
  if (!query) return orders;

  return orders.filter(
    (order) =>
      normalizeSearchValue(order.order_number).includes(query) ||
      normalizeSearchValue(order.invoice_number).includes(query),
  );
}
