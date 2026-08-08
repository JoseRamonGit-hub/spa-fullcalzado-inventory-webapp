import { describe, expect, it } from "vitest";
import { DEFAULT_SALES_PERIOD, getBillingComparison, SALES_PERIOD_OPTIONS } from "./sales-period";

describe("filtro de Ventas por período", () => {
  it("inicia en Esta semana y ofrece únicamente los presets contratados", () => {
    expect(DEFAULT_SALES_PERIOD).toBe("week");
    expect(SALES_PERIOD_OPTIONS).toEqual([
      { value: "today", label: "Hoy" },
      { value: "week", label: "Esta semana" },
      { value: "month", label: "Este mes" },
    ]);
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
