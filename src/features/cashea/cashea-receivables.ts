import type { CalendarDateRange, CasheaOrder, CasheaOrderStatus, CasheaOrdersFilter } from "@/types";
import { formatDateForBackend } from "@/utils/formatters";

/** Filtro de estado de la página Cashea: un estado de la Cuenta por cobrar Cashea o todos. */
export const casheaStatusFilters = ["pending", "collected", "voided", "all"] as const;

export type CasheaStatusFilter = (typeof casheaStatusFilters)[number];

export const DEFAULT_CASHEA_STATUS_FILTER: CasheaStatusFilter = "pending";

export const casheaStatusFilterLabels: Record<CasheaStatusFilter, string> = {
  pending: "Pendientes",
  collected: "Cobradas",
  voided: "Anuladas",
  all: "Todos los estados",
};

export const casheaOrderStatusLabels: Record<CasheaOrderStatus, string> = {
  pending: "Pendiente",
  collected: "Cobrada",
  voided: "Anulada",
};

/** Días que cubre la vista sin rango de los estados distintos de Pendiente, como la lista de Ventas. */
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

/** Describe la vista que se aplica cuando no se elige un rango de fechas. */
export function getCasheaDefaultPeriodLabel(status: CasheaStatusFilter) {
  return status === "pending" ? "Cualquier fecha" : `Últimos ${DEFAULT_PERIOD_DAYS} días`;
}

/**
 * Traduce los parámetros de búsqueda a la consulta de Órdenes Cashea (REQ-005).
 * Sin rango, las Pendientes no tienen límite de fecha y los demás estados se limitan a los últimos 30 días.
 */
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

/** Antigüedad en días de una orden: hoy en `America/Caracas` menos la fecha de la venta. */
export function getCasheaOrderAgeDays(saleDate: string, today = formatDateForBackend(new Date())): number | null {
  if (!isCalendarDate(saleDate) || !isCalendarDate(today)) return null;

  return Math.round((calendarDateToUtcTime(today) - calendarDateToUtcTime(saleDate)) / 86_400_000);
}

export type CasheaPendingSummary = {
  count: number;
  /** Saldo pendiente: suma del Monto financiado de las Pendientes. */
  financedUsd: number;
  /** Suma del Neto esperado de las Pendientes. */
  expectedNetUsd: number;
};

/** Totales de las órdenes Pendientes listadas; suma en centavos para no acumular errores de coma flotante. */
export function getCasheaPendingSummary(
  orders: readonly Pick<CasheaOrder, "status" | "financed_usd" | "expected_net_usd">[],
): CasheaPendingSummary {
  let count = 0;
  let financedCents = 0;
  let expectedNetCents = 0;

  for (const order of orders) {
    if (order.status !== "pending") continue;
    count += 1;
    financedCents += Math.round(order.financed_usd * 100);
    expectedNetCents += Math.round(order.expected_net_usd * 100);
  }

  return { count, financedUsd: financedCents / 100, expectedNetUsd: expectedNetCents / 100 };
}
