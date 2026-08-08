import { describe, expect, it } from "vitest";
import {
  analyzeCustomSalesRange,
  DEFAULT_SALES_PERIOD,
  getBillingComparison,
  SALES_PERIOD_OPTIONS,
} from "./sales-period";

describe("filtro de Ventas por período", () => {
  it("inicia en Esta semana y ofrece los períodos contratados", () => {
    expect(DEFAULT_SALES_PERIOD).toBe("week");
    expect(SALES_PERIOD_OPTIONS).toEqual([
      { value: "today", label: "Hoy" },
      { value: "week", label: "Esta semana" },
      { value: "month", label: "Este mes" },
      { value: "custom", label: "Personalizado" },
    ]);
  });
});

describe("rango personalizado de Ventas", () => {
  it.each([
    ["2024-02-23", "2024-02-29", 7, "day"],
    ["2024-02-22", "2024-02-29", 8, "week"],
    ["2024-01-01", "2024-02-29", 60, "week"],
    ["2023-12-31", "2024-02-29", 61, "month"],
  ] as const)("clasifica %s–%s como %s días agrupados por %s", (startDate, endDate, durationDays, granularity) => {
    expect(analyzeCustomSalesRange(startDate, endDate, "2024-02-29")).toMatchObject({
      isValid: true,
      durationDays,
      granularity,
    });
  });

  it("calcula el bloque anterior contiguo con la misma duración inclusiva", () => {
    expect(analyzeCustomSalesRange("2024-02-28", "2024-03-01", "2024-03-01")).toMatchObject({
      isValid: true,
      comparisonStart: "2024-02-25",
      comparisonEnd: "2024-02-27",
    });
  });

  it("rechaza futuro y orden inverso antes de consultar", () => {
    expect(analyzeCustomSalesRange("2024-03-01", "2024-03-02", "2024-03-01")).toMatchObject({ isValid: false });
    expect(analyzeCustomSalesRange("2024-03-01", "2024-02-29", "2024-03-01")).toMatchObject({ isValid: false });
  });

  it("advierte solo cuando el rango supera un año calendario", () => {
    expect(analyzeCustomSalesRange("2024-02-29", "2025-02-28", "2025-03-01")).toMatchObject({
      isValid: true,
      warning: undefined,
    });
    expect(analyzeCustomSalesRange("2024-02-29", "2025-03-01", "2025-03-01")).toMatchObject({
      isValid: true,
      warning: expect.any(String),
      granularity: "month",
    });
  });
});

describe("comparación de facturación", () => {
  it.each([
    [0, 0, "Sin actividad en este período", "neutral"],
    [125, 0, "Nuevo · sin actividad anterior", "positive"],
    [0, 125, "−100%", "negative"],
    [150, 100, "+50%", "positive"],
    [75, 100, "−25%", "negative"],
    [100.4, 100, "0%", "neutral"],
  ] as const)("compara %s contra %s", (current, previous, label, direction) => {
    expect(getBillingComparison(current, previous)).toEqual({ label, direction });
  });
});
