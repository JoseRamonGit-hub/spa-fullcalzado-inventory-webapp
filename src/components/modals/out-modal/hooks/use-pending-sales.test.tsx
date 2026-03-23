import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePendingSales } from "./use-pending-sales";
import type { PendingSale } from "../types";

function makeSale(overrides: Partial<PendingSale> = {}): PendingSale {
  return {
    tempId: "sale-1",
    productId: "prod-1",
    code: "SHO-01",
    description: "Zapatos Nike",
    quantity: 2,
    priceUsd: 60,
    priceVes: 2400,
    totalUsd: 120,
    totalVes: 4800,
    availableStock: 10,
    ...overrides,
  };
}

describe("usePendingSales", () => {
  it("empieza sin ventas pendientes y totales en cero", () => {
    const { result } = renderHook(() => usePendingSales());

    expect(result.current.pendingSales).toEqual([]);
    expect(result.current.totalAmountUsd).toBe(0);
    expect(result.current.totalAmountVes).toBe(0);
  });

  it("agrega una venta pendiente", () => {
    const { result } = renderHook(() => usePendingSales());
    const sale = makeSale();

    act(() => result.current.addPendingSale(sale));

    expect(result.current.pendingSales).toHaveLength(1);
    expect(result.current.pendingSales[0]).toEqual(sale);
  });

  it("calcula los totales correctamente al agregar ventas", () => {
    const { result } = renderHook(() => usePendingSales());

    act(() => {
      result.current.addPendingSale(makeSale({ tempId: "s1", totalUsd: 100, totalVes: 4000 }));
      result.current.addPendingSale(makeSale({ tempId: "s2", totalUsd: 50, totalVes: 2000 }));
    });

    expect(result.current.totalAmountUsd).toBe(150);
    expect(result.current.totalAmountVes).toBe(6000);
  });

  it("elimina una venta por tempId y recalcula totales", () => {
    const { result } = renderHook(() => usePendingSales());

    act(() => {
      result.current.addPendingSale(makeSale({ tempId: "s1", totalUsd: 100, totalVes: 4000 }));
      result.current.addPendingSale(makeSale({ tempId: "s2", totalUsd: 50, totalVes: 2000 }));
    });

    act(() => result.current.removePendingSale("s1"));

    expect(result.current.pendingSales).toHaveLength(1);
    expect(result.current.totalAmountUsd).toBe(50);
    expect(result.current.totalAmountVes).toBe(2000);
  });

  it("limpia todas las ventas pendientes", () => {
    const { result } = renderHook(() => usePendingSales());

    act(() => {
      result.current.addPendingSale(makeSale({ tempId: "s1" }));
      result.current.addPendingSale(makeSale({ tempId: "s2" }));
    });

    act(() => result.current.clearPendingSales());

    expect(result.current.pendingSales).toEqual([]);
    expect(result.current.totalAmountUsd).toBe(0);
    expect(result.current.totalAmountVes).toBe(0);
  });
});
