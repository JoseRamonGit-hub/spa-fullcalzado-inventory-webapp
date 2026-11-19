import { describe, expect, it } from "vitest";
import type { CashClose } from "@/types";
import {
  getCashCloseDayState,
  getCashCloseFigures,
  getCasheaBreakdown,
  getExchangeBreakdown,
  getLedgerLines,
  type CashCloseFigures,
} from "./cash-close-ledger";

const money = (usd: number) => ({ usd, ves: usd * 80 });

describe("renglones del cuadre", () => {
  it("agrupa iniciales y financiamiento bajo el resultado de Cashea", () => {
    const figures: CashCloseFigures = {
      billedOperations: 4,
      units: 4,
      returnsCount: 1,
      billed: { usd: 226.01, ves: 18080 },
      returnsCredit: money(57),
      casheaReceivable: { usd: 40, ves: 3500 },
      casheaVoidedReturn: money(3),
      produced: { usd: 132.01, ves: 10260 },
    };
    const date = "2026-11-19";
    const order = {
      sale_id: "sale",
      status: "pending" as const,
      void_reason: null,
      voided_at: null,
      paid_today_usd: 40,
      financed_usd: 40,
      exchange_rate: 87.5,
      sale: { transactions: [{ quantity: 1, total_usd: 80.01, total_ves: 7000 }] },
    };
    const cashea = getCasheaBreakdown(figures.casheaReceivable, date, [
      order,
      {
        ...order,
        sale_id: "voided",
        status: "voided",
        void_reason: "customer_return",
        voided_at: "2026-11-19T16:00:00Z",
      },
    ]);
    const lines = getLedgerLines(figures, { count: 1, units: 1, delivered: money(86), credit: money(57) }, cashea);
    expect(lines.map(({ id, amount }) => [id, amount.usd])).toEqual([
      ["sales", 60],
      ["exchanges", 29],
      ["returns", 0],
      ["cashea", 43.01],
    ]);
    expect(lines.find(({ id }) => id === "cashea")?.details).toMatchObject([
      { label: "Iniciales cobradas", amount: { usd: 40, ves: 3500 } },
      { label: "Monto financiado · fuera del total", amount: { usd: 40, ves: 3500 }, reference: true },
      { label: "Redondeo Cashea", amount: { usd: 0.01, ves: 0 } },
      { label: "Cashea anulado por devolución", amount: money(3) },
    ]);
    expect(lines.reduce((sum, line) => sum + line.amount.usd, 0)).toBeCloseTo(figures.produced.usd);
    expect(lines.reduce((sum, line) => sum + line.amount.ves, 0)).toBe(figures.produced.ves);
    expect(getCasheaBreakdown(figures.casheaReceivable, date, [])).toBeUndefined();
  });

  it.each([30, 20, 10])("separa un reemplazo de $%i de las ventas y devoluciones sin cambio", (replacement) => {
    const figures: CashCloseFigures = {
      billedOperations: 2,
      units: 2,
      returnsCount: 2,
      billed: money(100 + replacement),
      returnsCredit: money(25),
      casheaReceivable: money(12),
      casheaVoidedReturn: money(3),
      produced: money(66 + replacement),
    };
    const exchanges = getExchangeBreakdown(figures, [
      {
        type: "exchange",
        credit_usd: 20,
        credit_ves: 1600,
        transactions: [{ quantity: 1, total_usd: replacement, total_ves: replacement * 80 }],
      },
      { type: "refund", credit_usd: 5, credit_ves: 400, transactions: [] },
    ]);
    expect(exchanges).toEqual({ count: 1, units: 1, delivered: money(replacement), credit: money(20) });
    const lines = getLedgerLines(figures, exchanges);
    expect(lines.map((line) => line.amount)).toEqual([100, replacement - 20, -5, -9].map(money));
    expect(lines.find(({ id }) => id === "cashea")?.details).toMatchObject([
      { label: "Por cobrar a Cashea", amount: money(-12) },
      { label: "Cashea anulado por devolución", amount: money(3) },
    ]);
    expect(lines.reduce((sum, line) => sum + line.amount.usd, 0)).toBe(figures.produced.usd);
    expect(getExchangeBreakdown(figures, [])).toBeUndefined();
  });
});

it("marca el cierre de hoy como desactualizado si solo cambió el total en bolívares", () => {
  const cashClose: CashClose = {
    id: "close-1",
    business_id: "business-1",
    date: "2026-11-19",
    closed_at: "2026-11-19T13:51:00Z",
    closed_by: "user-1",
    exchange_rate: 80,
    total_billed_operations: 3,
    total_transactions: 3,
    total_units_sold: 4,
    total_usd: 100,
    total_ves: 8000,
    total_returns: 0,
    total_returns_usd: 0,
    total_returns_ves: 0,
    cashea_receivable_usd: null,
    cashea_receivable_ves: null,
    cashea_voided_return_usd: null,
    cashea_voided_return_ves: null,
  };
  const saved = getCashCloseFigures(cashClose);
  const input = { viewedDate: cashClose.date, todayKey: cashClose.date, cashClose, unclosedDates: [] };
  const figures = { ...saved, produced: { usd: 100, ves: 8100 } };

  expect(getCashCloseDayState({ ...input, figures: saved }).kind).toBe("closed");
  expect(getCashCloseDayState({ ...input, figures })).toMatchObject({
    kind: "outdated",
    deltaUsd: 0,
    deltaVes: 100,
  });
});
