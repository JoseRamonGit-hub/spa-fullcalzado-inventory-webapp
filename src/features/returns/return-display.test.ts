import { describe, expect, it } from "vitest";
import type { ReturnWithRelations } from "@/types";
import {
  getReturnMovementTotals,
  getReturnOutcome,
  getReturnPurchaseTotals,
  getReturnsSummary,
} from "./return-display";

function makeReturn(overrides: Partial<ReturnWithRelations> = {}): ReturnWithRelations {
  return {
    id: "return-1",
    business_id: "business-1",
    user_id: "user-1",
    type: "exchange",
    credit_usd: 20,
    credit_ves: 1_800,
    difference_usd: 10,
    difference_ves: 900,
    exchange_rate: 90,
    date: "2026-07-05",
    time: "10:00:00",
    created_at: "2026-07-05T10:00:00",
    notes: null,
    users: { fullname: "María Admin" },
    return_items: [
      {
        id: "return-item-1",
        business_id: "business-1",
        return_id: "return-1",
        product_id: "product-1",
        quantity: 2,
        price_usd: 10,
        price_ves: 900,
        products: { code: "NK-39", description: "Producto devuelto" },
      },
    ],
    transactions: [
      {
        id: "transaction-1",
        business_id: "business-1",
        user_id: "user-1",
        product_id: "product-2",
        return_id: "return-1",
        quantity: 1,
        price_usd: 30,
        price_ves: 2_700,
        total_usd: 30,
        total_ves: 2_700,
        exchange_rate: 90,
        date: "2026-07-05",
        time: "10:00:00",
        created_at: "2026-07-05T10:00:00",
        products: { code: "EST-40", description: "Producto de cambio" },
      },
    ],
    ...overrides,
  };
}

describe("return display helpers", () => {
  it("resume unidades de entrada y salida", () => {
    expect(getReturnMovementTotals(makeReturn())).toEqual({ entries: 2, exits: 1 });
  });

  it("mantiene USD y Bs del resultado con la misma dirección", () => {
    expect(getReturnOutcome(makeReturn())).toEqual({
      label: "Cliente paga",
      usd: 10,
      ves: 900,
      className: "text-success",
    });

    expect(getReturnOutcome(makeReturn({ difference_usd: -5, difference_ves: -450 }))).toEqual({
      label: "Tienda devuelve",
      usd: 5,
      ves: 450,
      className: "text-destructive",
    });
  });

  it("calcula compra nueva y resumen del período", () => {
    const record = makeReturn();

    expect(getReturnPurchaseTotals(record)).toEqual({ usd: 30, ves: 2_700 });
    expect(getReturnsSummary([record, makeReturn({ id: "return-2" })])).toEqual({
      operations: 2,
      entries: 4,
      exits: 2,
      creditUsd: 40,
      creditVes: 3_600,
    });
  });
});
