import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePendingSaleLines } from "./use-pending-sales";
import type { PendingSaleLine } from "../types";

function makeSaleLine(overrides: Partial<PendingSaleLine> = {}): PendingSaleLine {
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

describe("usePendingSaleLines", () => {
  it("empieza sin renglones pendientes y totales en cero", () => {
    const { result } = renderHook(() => usePendingSaleLines());

    expect(result.current.pendingSaleLines).toEqual([]);
    expect(result.current.totalAmountUsd).toBe(0);
    expect(result.current.totalAmountVes).toBe(0);
  });

  it("agrega un renglón pendiente", () => {
    const { result } = renderHook(() => usePendingSaleLines());
    const saleLine = makeSaleLine();

    act(() => result.current.addPendingSaleLine(saleLine));

    expect(result.current.pendingSaleLines).toHaveLength(1);
    expect(result.current.pendingSaleLines[0]).toEqual(saleLine);
  });

  it("calcula los totales correctamente al agregar renglones", () => {
    const { result } = renderHook(() => usePendingSaleLines());

    act(() => {
      result.current.addPendingSaleLine(makeSaleLine({ tempId: "s1", totalUsd: 100, totalVes: 4000 }));
      result.current.addPendingSaleLine(makeSaleLine({ tempId: "s2", totalUsd: 50, totalVes: 2000 }));
    });

    expect(result.current.totalAmountUsd).toBe(150);
    expect(result.current.totalAmountVes).toBe(6000);
  });

  it("elimina un renglón por tempId y recalcula totales", () => {
    const { result } = renderHook(() => usePendingSaleLines());

    act(() => {
      result.current.addPendingSaleLine(makeSaleLine({ tempId: "s1", totalUsd: 100, totalVes: 4000 }));
      result.current.addPendingSaleLine(makeSaleLine({ tempId: "s2", totalUsd: 50, totalVes: 2000 }));
    });

    act(() => result.current.removePendingSaleLine("s1"));

    expect(result.current.pendingSaleLines).toHaveLength(1);
    expect(result.current.totalAmountUsd).toBe(50);
    expect(result.current.totalAmountVes).toBe(2000);
  });

  it("limpia todos los renglones pendientes", () => {
    const { result } = renderHook(() => usePendingSaleLines());

    act(() => {
      result.current.addPendingSaleLine(makeSaleLine({ tempId: "s1" }));
      result.current.addPendingSaleLine(makeSaleLine({ tempId: "s2" }));
    });

    act(() => result.current.clearPendingSaleLines());

    expect(result.current.pendingSaleLines).toEqual([]);
    expect(result.current.totalAmountUsd).toBe(0);
    expect(result.current.totalAmountVes).toBe(0);
  });
});
