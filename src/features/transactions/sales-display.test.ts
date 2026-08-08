import { describe, expect, it } from "vitest";
import { getSalesSummary } from "./sales-display";

describe("getSalesSummary", () => {
  it("calcula facturación, créditos y total neto para el mismo período", () => {
    const summary = getSalesSummary(
      [
        { sale_id: null, return_id: null, quantity: 2, price_usd: 30, price_ves: 2_700 },
        { sale_id: null, return_id: null, quantity: 1, price_usd: 40, price_ves: 3_600 },
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
    const summary = getSalesSummary(
      [{ sale_id: null, return_id: null, quantity: 1, price_usd: 45, price_ves: 3_948.75 }],
      [],
    );

    expect(summary.netUsd).toBe(45);
    expect(summary.netVes).toBe(3_948.75);
    expect(summary.returnsCount).toBe(0);
  });

  it("cuenta una Venta multi-Renglón y un Renglón histórico como dos Ventas", () => {
    const summary = getSalesSummary(
      [
        { sale_id: "sale-1", return_id: null, quantity: 2, price_usd: 30, price_ves: 2_700 },
        { sale_id: "sale-1", return_id: null, quantity: 1, price_usd: 40, price_ves: 3_600 },
        { sale_id: null, return_id: null, quantity: 1, price_usd: 20, price_ves: 1_800 },
        { sale_id: null, return_id: "return-1", quantity: 1, price_usd: 15, price_ves: 1_350 },
      ],
      [],
    );

    expect(summary.records).toBe(2);
    expect(summary.units).toBe(5);
    expect(summary.grossUsd).toBe(135);
  });
});
