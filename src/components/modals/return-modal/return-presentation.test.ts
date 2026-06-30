import { describe, expect, it } from "vitest";
import { getReturnPresentation } from "./return-presentation";
import type { ReturnSummary } from "./types";

function makeSummary(overrides: Partial<ReturnSummary> = {}): ReturnSummary {
  return {
    returnType: "exchange",
    creditUsd: 40,
    newPurchaseUsd: 60,
    differenceUsd: 20,
    differenceVes: 1_755,
    ...overrides,
  };
}

describe("getReturnPresentation", () => {
  it("muestra diferencia positiva en verde cuando paga el cliente", () => {
    const presentation = getReturnPresentation(makeSummary(), true);

    expect(presentation.outcomeLabel).toBe("Cliente paga");
    expect(presentation.differenceUsd).toBe(20);
    expect(presentation.differenceClassName).toBe("text-success");
  });

  it("muestra diferencia negativa en rojo cuando paga la tienda", () => {
    const presentation = getReturnPresentation(makeSummary({ differenceUsd: -15, differenceVes: -1_316.25 }), true);

    expect(presentation.outcomeLabel).toBe("Tienda devuelve");
    expect(presentation.differenceUsd).toBe(-15);
    expect(presentation.differenceClassName).toBe("text-destructive");
  });

  it("mantiene neutral un cambio exacto", () => {
    const presentation = getReturnPresentation(makeSummary({ differenceUsd: 0, differenceVes: 0 }), true);

    expect(presentation.outcomeLabel).toBe("Cambio exacto");
    expect(presentation.differenceClassName).toBe("text-foreground");
  });

  it("no comunica una diferencia antes de agregar productos", () => {
    const presentation = getReturnPresentation(makeSummary(), false);

    expect(presentation.outcomeLabel).toBe("Sin resultado");
    expect(presentation.differenceUsd).toBe(0);
    expect(presentation.differenceVes).toBe(0);
  });
});
