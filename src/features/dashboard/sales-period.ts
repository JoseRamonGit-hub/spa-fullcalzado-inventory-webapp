import type { DashboardSalesPeriodPreset } from "@/types";
import { formatInteger } from "@/utils/formatters";

export const DEFAULT_SALES_PERIOD: DashboardSalesPeriodPreset = "week";

export type DashboardSalesPeriodSelection = {
  preset: DashboardSalesPeriodPreset;
  customStartDate?: string;
  customEndDate?: string;
};

export const SALES_PERIOD_OPTIONS: ReadonlyArray<{ value: DashboardSalesPeriodPreset; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
];

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_IN_MS = 86_400_000;

export type CustomSalesRangeAnalysis =
  | { isValid: false; error: string }
  | {
      isValid: true;
      durationDays: number;
      granularity: "day" | "week" | "month";
      comparisonStart: string;
      comparisonEnd: string;
      warning: string | undefined;
    };

function parseDateOnly(value: string | undefined) {
  const match = value?.match(DATE_ONLY_PATTERN);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (formatDateOnly(date) !== value) return null;

  return date;
}

function formatDateOnly(date: Date) {
  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_IN_MS);
}

function getInclusiveCalendarYearEnd(start: Date) {
  const nextYear = start.getUTCFullYear() + 1;
  const month = start.getUTCMonth();
  const day = start.getUTCDate();
  const anniversary = new Date(Date.UTC(nextYear, month, day));

  return addDays(anniversary, -1);
}

export function analyzeCustomSalesRange(
  startDateValue: string | undefined,
  endDateValue: string | undefined,
  todayValue: string,
): CustomSalesRangeAnalysis {
  if (!startDateValue || !endDateValue) {
    return { isValid: false, error: "Selecciona una fecha de inicio y una fecha de fin." };
  }

  const startDate = parseDateOnly(startDateValue);
  const endDate = parseDateOnly(endDateValue);
  const today = parseDateOnly(todayValue);
  if (!startDate || !endDate || !today) {
    return { isValid: false, error: "El rango contiene una fecha inválida." };
  }

  if (endDate < startDate) {
    return { isValid: false, error: "La fecha de fin no puede ser anterior al inicio." };
  }

  if (startDate > today || endDate > today) {
    return { isValid: false, error: "El rango no puede incluir fechas futuras." };
  }

  const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / DAY_IN_MS) + 1;
  const comparisonEnd = addDays(startDate, -1);
  const comparisonStart = addDays(comparisonEnd, -(durationDays - 1));
  const isLongerThanCalendarYear = endDate > getInclusiveCalendarYearEnd(startDate);

  return {
    isValid: true,
    durationDays,
    granularity: durationDays <= 7 ? "day" : durationDays <= 60 ? "week" : "month",
    comparisonStart: formatDateOnly(comparisonStart),
    comparisonEnd: formatDateOnly(comparisonEnd),
    warning: isLongerThanCalendarYear
      ? "El rango supera un año; la gráfica se agrupará por meses calendario."
      : undefined,
  };
}

export type BillingComparison = {
  label: string;
  direction: "positive" | "negative" | "neutral";
};

export function getBillingComparison(currentTotal: number, previousTotal: number): BillingComparison {
  if (currentTotal === 0 && previousTotal === 0) {
    return { label: "Sin ventas en ninguno de los dos períodos", direction: "neutral" };
  }

  if (previousTotal === 0) {
    return { label: "Sin ventas anteriores", direction: "positive" };
  }

  if (currentTotal === 0) {
    return { label: "−100%", direction: "negative" };
  }

  const percentage = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  if (percentage === 0) return { label: "0%", direction: "neutral" };

  return {
    label: `${percentage > 0 ? "+" : "−"}${formatInteger(Math.abs(percentage))}%`,
    direction: percentage > 0 ? "positive" : "negative",
  };
}
