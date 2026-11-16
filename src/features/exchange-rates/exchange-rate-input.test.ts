import { describe, expect, it } from "vitest";
import { parseExchangeRateInput, toExchangeRateInput } from "./exchange-rate-input";

describe("parseExchangeRateInput", () => {
  it("acepta coma o punto decimal", () => {
    expect(parseExchangeRateInput("87,75")).toEqual({ rate: 87.75 });
    expect(parseExchangeRateInput(" 87.75 ")).toEqual({ rate: 87.75 });
  });

  it("tolera el separador final mientras se escribe", () => {
    expect(parseExchangeRateInput("88,")).toEqual({ rate: 88 });
  });

  it("distingue el campo vacío de un valor inválido", () => {
    expect(parseExchangeRateInput("  ")).toEqual({ empty: true });
    expect(parseExchangeRateInput("87.750,00")).toHaveProperty("error");
    expect(parseExchangeRateInput("-5")).toHaveProperty("error");
  });

  it("rechaza cero y más de cuatro decimales", () => {
    expect(parseExchangeRateInput("0")).toEqual({ error: "Debe ser mayor que cero" });
    expect(parseExchangeRateInput("87,12345")).toEqual({ error: "Máximo 4 decimales" });
  });
});

describe("toExchangeRateInput", () => {
  it("escribe la tasa con coma decimal y sin separador de miles", () => {
    expect(toExchangeRateInput(1234.5)).toBe("1234,50");
    expect(toExchangeRateInput(87.1)).toBe("87,10");
    expect(toExchangeRateInput(87.1234)).toBe("87,1234");
    expect(toExchangeRateInput(null)).toBe("");
  });
});
