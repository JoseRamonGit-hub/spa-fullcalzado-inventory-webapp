import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useSubmitBatch } from "./use-submit-batch";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { BatchItem, NewBatchItem, ExistingBatchItem } from "../columns";
import type { ReactNode } from "react";

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

vi.mock("@/services/productsService", () => ({
  productsService: { createMany: vi.fn() },
}));

vi.mock("@/services/inventoryMovementsService", () => ({
  inventoryMovementsService: { createMany: vi.fn() },
}));

const { productsService } = await import("@/services/productsService");
const { inventoryMovementsService } = await import("@/services/inventoryMovementsService");

const mockCreateManyProducts = vi.mocked(productsService.createMany);
const mockCreateManyMovements = vi.mocked(inventoryMovementsService.createMany);

const mockUser = { id: "user-123", email: "test@test.com", fullname: "Test", role: "admin", created_at: "" } as any;

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSubmitBatch", () => {
  const clearPendingBatchItems = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, isInitialized: true });
  });

  function renderSubmitBatch(pendingBatchItems: BatchItem[]) {
    return renderHook(() => useSubmitBatch({ pendingBatchItems, clearPendingBatchItems, onSuccess }), {
      wrapper: createWrapper(),
    });
  }

  it("no hace nada si no hay items pendientes", async () => {
    const { result } = renderSubmitBatch([]);

    await act(() => result.current.submitPendingBatchItems());

    expect(mockCreateManyProducts).not.toHaveBeenCalled();
    expect(mockCreateManyMovements).not.toHaveBeenCalled();
    expect(clearPendingBatchItems).not.toHaveBeenCalled();
  });

  it("crea productos nuevos cuando hay items tipo 'new'", async () => {
    mockCreateManyProducts.mockResolvedValue([{ id: "new-1" }] as any);
    const { result } = renderSubmitBatch([newItem]);

    await act(() => result.current.submitPendingBatchItems());

    expect(mockCreateManyProducts).toHaveBeenCalledWith([
      { code: "SHO-01", description: "Zapatos Nike", price_usd: 120, stock: 5 },
    ]);
    expect(clearPendingBatchItems).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("crea movimientos cuando hay items tipo 'existing'", async () => {
    mockCreateManyMovements.mockResolvedValue([{ id: "mov-1" }] as any);
    const { result } = renderSubmitBatch([existingItem]);

    await act(() => result.current.submitPendingBatchItems());

    expect(mockCreateManyMovements).toHaveBeenCalledWith([
      {
        product_id: "prod-1",
        quantity: 3,
        type: "entry",
        user_id: "user-123",
        stock_before: 10,
        price_usd: 100,
      },
    ]);
    expect(clearPendingBatchItems).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("ejecuta ambas operaciones cuando hay items nuevos y existentes", async () => {
    mockCreateManyProducts.mockResolvedValue([{ id: "new-1" }] as any);
    mockCreateManyMovements.mockResolvedValue([{ id: "mov-1" }] as any);
    const { result } = renderSubmitBatch([newItem, existingItem]);

    await act(() => result.current.submitPendingBatchItems());

    expect(mockCreateManyProducts).toHaveBeenCalled();
    expect(mockCreateManyMovements).toHaveBeenCalled();
    expect(clearPendingBatchItems).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("usa priceUsd del item existente si está definido", async () => {
    const itemWithPrice: ExistingBatchItem = { ...existingItem, priceUsd: 150, originalPriceUsd: 100 };
    mockCreateManyMovements.mockResolvedValue([{ id: "mov-1" }] as any);
    const { result } = renderSubmitBatch([itemWithPrice]);

    await act(() => result.current.submitPendingBatchItems());

    expect(mockCreateManyMovements).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ price_usd: 150 })]),
    );
  });
});
