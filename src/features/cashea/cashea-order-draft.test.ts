import { describe, expect, it } from "vitest";
import { EMPTY_CASHEA_ORDER_DRAFT, evaluateCasheaOrderDraft, type CasheaOrderDraft } from "./cashea-order-draft";

const VALID_DRAFT: CasheaOrderDraft = {
  orderNumber: "6400685",
  invoiceNumber: "551-000738",
  totalUsd: "185.60",
  paidTodayUsd: "92.80",
  financedUsd: "92.80",
};

const SALE_TOTAL_USD = 185.6;

function evaluate(overrides: Partial<CasheaOrderDraft> = {}, saleTotalUsd = SALE_TOTAL_USD) {
  return evaluateCasheaOrderDraft({ ...VALID_DRAFT, ...overrides }, saleTotalUsd);
}

describe("evaluateCasheaOrderDraft", () => {
  it("exige los cinco datos de la Orden Cashea", () => {
    const evaluation = evaluateCasheaOrderDraft(EMPTY_CASHEA_ORDER_DRAFT, SALE_TOTAL_USD);

    expect(evaluation.order).toBeNull();
    expect(evaluation.fieldErrors).toEqual({
      orderNumber: "Campo obligatorio",
      invoiceNumber: "Campo obligatorio",
      totalUsd: "Campo obligatorio",
      paidTodayUsd: "Campo obligatorio",
      financedUsd: "Campo obligatorio",
    });
  });

  it("devuelve la Orden Cashea lista para enviar cuando los datos son válidos", () => {
    const evaluation = evaluate({ orderNumber: "  6400685 ", invoiceNumber: " 551-000738  ", totalUsd: "185.6" });

    expect(evaluation.fieldErrors).toEqual({});
    expect(evaluation.sumError).toBeNull();
    expect(evaluation.order).toEqual({
      order_number: "6400685",
      invoice_number: "551-000738",
      total_usd: 185.6,
      paid_today_usd: 92.8,
      financed_usd: 92.8,
    });
  });

  it("acepta la coma como separador decimal", () => {
    const evaluation = evaluate({ totalUsd: "185,60", paidTodayUsd: "92,80", financedUsd: "92,80" });

    expect(evaluation.order).toMatchObject({ total_usd: 185.6, paid_today_usd: 92.8, financed_usd: 92.8 });
  });

  it("rechaza montos con más de dos decimales", () => {
    const evaluation = evaluate({ paidTodayUsd: "92.805" });

    expect(evaluation.fieldErrors.paidTodayUsd).toBe("Máximo dos decimales");
    expect(evaluation.order).toBeNull();
  });

  it("rechaza montos que no son números", () => {
    expect(evaluate({ totalUsd: "abc" }).fieldErrors.totalUsd).toBe("Monto inválido");
  });

  it("exige total y Monto financiado mayores a cero y Cobrado hoy no negativo", () => {
    expect(evaluate({ totalUsd: "0" }).fieldErrors.totalUsd).toBe("Debe ser mayor a 0");
    expect(evaluate({ financedUsd: "0" }).fieldErrors.financedUsd).toBe("Debe ser mayor a 0");
    expect(evaluate({ paidTodayUsd: "-1" }).fieldErrors.paidTodayUsd).toBe("No puede ser negativo");
  });

  it("acepta un Cobrado hoy en cero", () => {
    const evaluation = evaluate({ totalUsd: "92.80", paidTodayUsd: "0", financedUsd: "92.80" });

    expect(evaluation.order).toMatchObject({ paid_today_usd: 0 });
  });

  it("limita los números de orden y de factura a 40 caracteres", () => {
    const evaluation = evaluate({ orderNumber: "1".repeat(41), invoiceNumber: "F".repeat(41) });

    expect(evaluation.fieldErrors.orderNumber).toBe("Máximo 40 caracteres");
    expect(evaluation.fieldErrors.invoiceNumber).toBe("Máximo 40 caracteres");
  });

  it("muestra la suma de Cobrado hoy y Monto financiado y bloquea si difiere del total en más de $0.01", () => {
    const evaluation = evaluate({ totalUsd: "100", paidTodayUsd: "40", financedUsd: "59.98" }, 100);

    expect(evaluation.orderTotalUsd).toBe(100);
    expect(evaluation.sumUsd).toBe(99.98);
    expect(evaluation.sumDifferenceUsd).toBe(-0.02);
    expect(evaluation.sumError).toBe("Cobrado hoy + Monto financiado debe coincidir con el total de la orden");
    expect(evaluation.order).toBeNull();
  });

  it("tolera una diferencia de $0.01 entre la suma y el total", () => {
    const evaluation = evaluate({ totalUsd: "100", paidTodayUsd: "40", financedUsd: "59.99" }, 100);

    expect(evaluation.sumError).toBeNull();
    expect(evaluation.order).not.toBeNull();
  });

  it("no calcula la suma mientras falte un monto", () => {
    const evaluation = evaluate({ financedUsd: "" });

    expect(evaluation.sumUsd).toBeNull();
    expect(evaluation.sumDifferenceUsd).toBeNull();
    expect(evaluation.sumError).toBeNull();
  });

  it("bloquea si el Monto financiado supera el total de la venta", () => {
    const evaluation = evaluate({ totalUsd: "200", paidTodayUsd: "10", financedUsd: "190" }, 185.6);

    expect(evaluation.fieldErrors.financedUsd).toBe("No puede superar el total de la venta");
    expect(evaluation.order).toBeNull();
  });

  it("advierte sin bloquear cuando el total de la orden difiere del total de la venta en más de $0.01", () => {
    const evaluation = evaluate({ totalUsd: "180", paidTodayUsd: "90", financedUsd: "90" });

    expect(evaluation.saleTotalMismatch).toBe(true);
    expect(evaluation.order).not.toBeNull();
  });

  it("no advierte cuando el total de la orden coincide con el total de la venta dentro de $0.01", () => {
    expect(evaluate({ totalUsd: "185.61", paidTodayUsd: "92.81" }).saleTotalMismatch).toBe(false);
  });
});
