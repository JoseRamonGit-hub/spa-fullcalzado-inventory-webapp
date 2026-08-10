import { describe, expect, it } from "vitest";
import { formatCalendarDateForBackend, formatCurrencyVES, formatInteger } from "./formatters";

describe("formatCurrencyVES", () => {
  it("incluye la moneda por defecto", () => {
    expect(formatCurrencyVES(3_334.5)).toBe("3.334,50 Bs.");
  });

  it("permite omitir la moneda cuando la interfaz ya la etiqueta", () => {
    expect(formatCurrencyVES(3_334.5, { includeCurrency: false })).toBe("3.334,50");
  });
});

describe("formatCalendarDateForBackend", () => {
  it("preserva el día elegido en el calendario sin convertirlo a Caracas", () => {
    expect(formatCalendarDateForBackend(new Date(2026, 7, 8))).toBe("2026-08-08");
  });
});

describe("formatInteger", () => {
  it("usa el separador de miles venezolano", () => {
    expect(formatInteger(1350)).toBe("1.350");
  });
});
