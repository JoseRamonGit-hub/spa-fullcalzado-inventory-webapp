import { describe, expect, it } from "vitest";
import { getSalesSummary } from "./sales-display";

describe("getSalesSummary", () => {
  it("calcula facturación, créditos y total neto para el mismo período", () => {
    const summary = getSalesSummary(
      [
        { quantity: 2, price_usd: 30, price_ves: 2_700 },
        { quantity: 1, price_usd: 40, price_ves: 3_600 },
      ],
      [{ credit_usd: 25, credit_ves: 2_250 }],
    );

    expect(summary).toEqual({
      records: 2,
      units: 3,
      grossUsd: 100,
      grossVes: 9_000,
      returnsCount: 1,
      returnsCreditUsd: 25,
      returnsCreditVes: 2_250,
      netUsd: 75,
      netVes: 6_750,
    });
  });

  it("mantiene el neto igual al facturado cuando no hay devoluciones", () => {
    const summary = getSalesSummary([{ quantity: 1, price_usd: 45, price_ves: 3_948.75 }], []);

    expect(summary.netUsd).toBe(45);
    expect(summary.netVes).toBe(3_948.75);
    expect(summary.returnsCount).toBe(0);
  });
});
