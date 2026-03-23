import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBatch } from "./use-batch";
import type { NewBatchItem, ExistingBatchItem } from "../columns";

const newItem: NewBatchItem = {
  kind: "new",
  tempId: "temp-1",
  code: "SHO-01",
  description: "Zapatos Nike",
  priceUsd: 120,
  initialStock: 5,
};

const existingItem: ExistingBatchItem = {
  kind: "existing",
  tempId: "temp-2",
  productId: "prod-1",
  code: "SHO-02",
  description: "Zapatos Adidas",
  addedQuantity: 3,
  currentStock: 10,
  currentPriceUsd: 100,
};

describe("useBatch", () => {
  it("empieza sin items pendientes", () => {
    const { result } = renderHook(() => useBatch());

    expect(result.current.pendingBatchItems).toEqual([]);
  });

  it("agrega un item nuevo al batch", () => {
    const { result } = renderHook(() => useBatch());

    act(() => result.current.addPendingBatchItem(newItem));

    expect(result.current.pendingBatchItems).toHaveLength(1);
    expect(result.current.pendingBatchItems[0]).toEqual(newItem);
  });

  it("agrega un item existente al batch", () => {
    const { result } = renderHook(() => useBatch());

    act(() => result.current.addPendingBatchItem(existingItem));

    expect(result.current.pendingBatchItems).toHaveLength(1);
    expect(result.current.pendingBatchItems[0]).toEqual(existingItem);
  });

  it("agrega múltiples items al batch", () => {
    const { result } = renderHook(() => useBatch());

    act(() => {
      result.current.addPendingBatchItem(newItem);
      result.current.addPendingBatchItem(existingItem);
    });

    expect(result.current.pendingBatchItems).toHaveLength(2);
  });

  it("elimina un item por tempId", () => {
    const { result } = renderHook(() => useBatch());

    act(() => {
      result.current.addPendingBatchItem(newItem);
      result.current.addPendingBatchItem(existingItem);
    });

    act(() => result.current.removePendingBatchItem("temp-1"));

    expect(result.current.pendingBatchItems).toHaveLength(1);
    expect(result.current.pendingBatchItems[0].tempId).toBe("temp-2");
  });

  it("limpia todos los items del batch", () => {
    const { result } = renderHook(() => useBatch());

    act(() => {
      result.current.addPendingBatchItem(newItem);
      result.current.addPendingBatchItem(existingItem);
    });

    act(() => result.current.clearPendingBatchItems());

    expect(result.current.pendingBatchItems).toEqual([]);
  });
});
