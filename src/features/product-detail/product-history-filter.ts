import { formatDateForBackend } from "@/utils/formatters";
import type { ProductHistoryRange } from "@/types";

export const productHistoryPeriods = ["last-30-days", "last-90-days", "all", "custom"] as const;

export type ProductHistoryPeriod = (typeof productHistoryPeriods)[number];

export type ProductHistoryCustomRange = {
  startDate?: string;
  endDate?: string;
};

export type { ProductHistoryRange } from "@/types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string) {
  if (!datePattern.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function subtractCalendarDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function getProductHistoryRange(
  period: ProductHistoryPeriod,
  customRange?: ProductHistoryCustomRange,
  today = formatDateForBackend(new Date()),
): ProductHistoryRange | null {
  if (!isCalendarDate(today)) return null;

  if (period === "last-30-days") {
    return { startDate: subtractCalendarDays(today, 29), endDate: today, showAll: false };
  }

  if (period === "last-90-days") {
    return { startDate: subtractCalendarDays(today, 89), endDate: today, showAll: false };
  }

  if (period === "all") {
    return { startDate: undefined, endDate: undefined, showAll: true };
  }

  const { startDate, endDate } = customRange ?? {};
  if (!startDate || !endDate || !isCalendarDate(startDate) || !isCalendarDate(endDate)) return null;
  if (startDate > endDate || endDate > today) return null;

  return { startDate, endDate, showAll: false };
}
