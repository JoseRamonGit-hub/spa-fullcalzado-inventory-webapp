import { describe, expect, it } from "vitest";
import { formatCurrencyVES } from "./formatters";

describe("formatCurrencyVES", () => {
  it("incluye la moneda por defecto", () => {
    expect(formatCurrencyVES(3_334.5)).toBe("3.334,50 Bs.");
  });

  it("permite omitir la moneda cuando la interfaz ya la etiqueta", () => {
    expect(formatCurrencyVES(3_334.5, { includeCurrency: false })).toBe("3.334,50");
  });
});
