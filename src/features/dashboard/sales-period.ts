import type { DashboardSalesPeriodPreset } from "@/types";

export const DEFAULT_SALES_PERIOD: DashboardSalesPeriodPreset = "week";

export const SALES_PERIOD_OPTIONS: ReadonlyArray<{ value: DashboardSalesPeriodPreset; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
];

export type BillingComparison = {
  label: string;
  direction: "positive" | "negative" | "neutral";
};

export function getBillingComparison(currentTotal: number, previousTotal: number): BillingComparison {
  if (currentTotal === 0 && previousTotal === 0) {
    return { label: "Sin actividad en este período", direction: "neutral" };
  }

  if (previousTotal === 0) {
    return { label: "Nuevo · sin actividad anterior", direction: "positive" };
  }

  if (currentTotal === 0) {
    return { label: "−100%", direction: "negative" };
  }

  const percentage = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  if (percentage === 0) return { label: "0%", direction: "neutral" };

  return {
    label: `${percentage > 0 ? "+" : "−"}${Math.abs(percentage)}%`,
    direction: percentage > 0 ? "positive" : "negative",
  };
}
