import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePendingReturn } from "./use-pending-return";
import type { PendingReturnItem, PendingExchangeItem } from "../types";

function makeReturnItem(overrides: Partial<PendingReturnItem> = {}): PendingReturnItem {
  return {
    tempId: "ret-1",
    productId: "prod-1",
    code: "SHO-01",
    description: "Zapatos Nike",
    quantity: 1,
    priceUsd: 60,
    priceVes: 2400,
    totalUsd: 60,
    totalVes: 2400,
    ...overrides,
  };
}

function makeExchangeItem(overrides: Partial<PendingExchangeItem> = {}): PendingExchangeItem {
  return {
    tempId: "exc-1",
    productId: "prod-2",
    code: "SHO-02",
    description: "Zapatos Adidas",
    quantity: 1,
    priceUsd: 80,
    priceVes: 3200,
    totalUsd: 80,
    totalVes: 3200,
    availableStock: 5,
    ...overrides,
  };
}

describe("usePendingReturn", () => {
  it("empieza sin items y totales en cero", () => {
    const { result } = renderHook(() => usePendingReturn());

    expect(result.current.returnItems).toEqual([]);
    expect(result.current.exchangeItems).toEqual([]);
    expect(result.current.creditUsd).toBe(0);
    expect(result.current.creditVes).toBe(0);
    expect(result.current.newPurchaseUsd).toBe(0);
    expect(result.current.newPurchaseVes).toBe(0);
    expect(result.current.differenceUsd).toBe(0);
    expect(result.current.differenceVes).toBe(0);
  });

  it("tipo es 'refund' cuando no hay items de intercambio", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => result.current.addReturnItem(makeReturnItem()));

    expect(result.current.returnType).toBe("refund");
  });

  it("tipo es 'exchange' cuando hay items de intercambio", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addReturnItem(makeReturnItem());
      result.current.addExchangeItem(makeExchangeItem());
    });

    expect(result.current.returnType).toBe("exchange");
  });

  it("calcula crédito USD/VES al agregar devoluciones", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addReturnItem(makeReturnItem({ tempId: "r1", totalUsd: 60, totalVes: 2400 }));
      result.current.addReturnItem(makeReturnItem({ tempId: "r2", totalUsd: 40, totalVes: 1600 }));
    });

    expect(result.current.creditUsd).toBe(100);
    expect(result.current.creditVes).toBe(4000);
  });

  it("calcula nueva compra USD/VES al agregar intercambios", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addExchangeItem(makeExchangeItem({ tempId: "e1", totalUsd: 80, totalVes: 3200 }));
      result.current.addExchangeItem(makeExchangeItem({ tempId: "e2", totalUsd: 50, totalVes: 2000 }));
    });

    expect(result.current.newPurchaseUsd).toBe(130);
    expect(result.current.newPurchaseVes).toBe(5200);
  });

  it("calcula la diferencia correctamente (nueva compra - crédito)", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addReturnItem(makeReturnItem({ tempId: "r1", totalUsd: 60, totalVes: 2400 }));
      result.current.addExchangeItem(makeExchangeItem({ tempId: "e1", totalUsd: 80, totalVes: 3200 }));
    });

    // diferencia = nueva compra - crédito
    expect(result.current.differenceUsd).toBe(20);
    expect(result.current.differenceVes).toBe(800);
  });

  it("diferencia negativa cuando el crédito es mayor que la nueva compra", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addReturnItem(makeReturnItem({ tempId: "r1", totalUsd: 100, totalVes: 4000 }));
      result.current.addExchangeItem(makeExchangeItem({ tempId: "e1", totalUsd: 60, totalVes: 2400 }));
    });

    expect(result.current.differenceUsd).toBe(-40);
    expect(result.current.differenceVes).toBe(-1600);
  });

  it("elimina items de devolución por tempId", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addReturnItem(makeReturnItem({ tempId: "r1", totalUsd: 60, totalVes: 2400 }));
      result.current.addReturnItem(makeReturnItem({ tempId: "r2", totalUsd: 40, totalVes: 1600 }));
    });

    act(() => result.current.removeReturnItem("r1"));

    expect(result.current.returnItems).toHaveLength(1);
    expect(result.current.creditUsd).toBe(40);
  });

  it("elimina items de intercambio por tempId", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addExchangeItem(makeExchangeItem({ tempId: "e1", totalUsd: 80, totalVes: 3200 }));
      result.current.addExchangeItem(makeExchangeItem({ tempId: "e2", totalUsd: 50, totalVes: 2000 }));
    });

    act(() => result.current.removeExchangeItem("e1"));

    expect(result.current.exchangeItems).toHaveLength(1);
    expect(result.current.newPurchaseUsd).toBe(50);
  });

  it("clearAll limpia ambas listas", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addReturnItem(makeReturnItem());
      result.current.addExchangeItem(makeExchangeItem());
    });

    act(() => result.current.clearAll());

    expect(result.current.returnItems).toEqual([]);
    expect(result.current.exchangeItems).toEqual([]);
    expect(result.current.creditUsd).toBe(0);
    expect(result.current.newPurchaseUsd).toBe(0);
  });

  it("vuelve a tipo 'refund' al eliminar todos los items de intercambio", () => {
    const { result } = renderHook(() => usePendingReturn());

    act(() => {
      result.current.addReturnItem(makeReturnItem());
      result.current.addExchangeItem(makeExchangeItem({ tempId: "e1" }));
    });

    expect(result.current.returnType).toBe("exchange");

    act(() => result.current.removeExchangeItem("e1"));

    expect(result.current.returnType).toBe("refund");
  });
});
