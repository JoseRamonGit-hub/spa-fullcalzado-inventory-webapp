import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCasheaPayment } from "./use-cashea-payment";

const COMPLETE_DRAFT = {
  orderNumber: "6400685",
  invoiceNumber: "551-000738",
  totalUsd: "120",
  paidTodayUsd: "60",
  financedUsd: "60",
};

describe("useCasheaPayment", () => {
  it("una venta sin Cashea no bloquea la confirmación ni envía Orden Cashea", () => {
    const { result } = renderHook(() => useCasheaPayment(120));

    expect(result.current.isCasheaPayment).toBe(false);
    expect(result.current.isCasheaIncomplete).toBe(false);
    expect(result.current.casheaOrder).toBeNull();
  });

  it("con «Pago con Cashea» activo y datos incompletos bloquea la confirmación", () => {
    const { result } = renderHook(() => useCasheaPayment(120));

    act(() => result.current.setIsCasheaPayment(true));
    act(() => result.current.setDraft({ ...COMPLETE_DRAFT, invoiceNumber: "" }));

    expect(result.current.isCasheaIncomplete).toBe(true);
    expect(result.current.casheaOrder).toBeNull();
  });

  it("con los cinco datos válidos entrega la Orden Cashea para enviar", () => {
    const { result } = renderHook(() => useCasheaPayment(120));

    act(() => result.current.setIsCasheaPayment(true));
    act(() => result.current.setDraft(COMPLETE_DRAFT));

    expect(result.current.isCasheaIncomplete).toBe(false);
    expect(result.current.casheaOrder).toEqual({
      order_number: "6400685",
      invoice_number: "551-000738",
      total_usd: 120,
      paid_today_usd: 60,
      financed_usd: 60,
    });
  });

  it("al desactivar «Pago con Cashea» la venta deja de llevar Orden Cashea", () => {
    const { result } = renderHook(() => useCasheaPayment(120));

    act(() => result.current.setIsCasheaPayment(true));
    act(() => result.current.setDraft(COMPLETE_DRAFT));
    act(() => result.current.setIsCasheaPayment(false));

    expect(result.current.casheaOrder).toBeNull();
    expect(result.current.isCasheaIncomplete).toBe(false);
  });

  it("limpiar desactiva «Pago con Cashea» y vacía los datos", () => {
    const { result } = renderHook(() => useCasheaPayment(120));

    act(() => result.current.setIsCasheaPayment(true));
    act(() => result.current.setDraft(COMPLETE_DRAFT));
    act(() => result.current.clearCasheaPayment());

    expect(result.current.isCasheaPayment).toBe(false);
    expect(result.current.draft).toEqual({
      orderNumber: "",
      invoiceNumber: "",
      totalUsd: "",
      paidTodayUsd: "",
      financedUsd: "",
    });
  });

  it("valida el Monto financiado contra el total de la venta vigente", () => {
    const { result, rerender } = renderHook(({ saleTotalUsd }) => useCasheaPayment(saleTotalUsd), {
      initialProps: { saleTotalUsd: 120 },
    });

    act(() => result.current.setIsCasheaPayment(true));
    act(() => result.current.setDraft(COMPLETE_DRAFT));
    rerender({ saleTotalUsd: 50 });

    expect(result.current.evaluation.fieldErrors.financedUsd).toBe("No puede superar el total de la venta");
    expect(result.current.isCasheaIncomplete).toBe(true);
  });
});
