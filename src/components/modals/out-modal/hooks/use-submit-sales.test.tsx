import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useSubmitSales } from "./use-submit-sales";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { PendingSale } from "../types";
import type { ReactNode } from "react";
import type { User } from "@/types";

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

vi.mock("@/services/transactionsService", () => ({
  transactionsService: { createSale: vi.fn() },
}));

const { transactionsService } = await import("@/services/transactionsService");
const mockCreateSale = vi.mocked(transactionsService.createSale);

const mockUser = {
  id: "user-123",
  email: "test@test.com",
  fullname: "Test",
  role: "admin",
  created_at: "",
} as User;
const BUSINESS_ID = "business-1";

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSubmitSales", () => {
  const clearPendingSales = vi.fn();
  const onSuccess = vi.fn();
  const currentExchangeRate = 40;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
    useBusinessStore.setState({ activeBusinessId: BUSINESS_ID });
  });

  function renderSubmitSales(pendingSales: PendingSale[]) {
    return renderHook(() => useSubmitSales({ pendingSales, currentExchangeRate, clearPendingSales, onSuccess }), {
      wrapper: createWrapper(),
    });
  }

  it("no hace nada si no hay ventas pendientes", async () => {
    const { result } = renderSubmitSales([]);

    await act(() => result.current.submitPendingSales());

    expect(mockCreateSale).not.toHaveBeenCalled();
    expect(clearPendingSales).not.toHaveBeenCalled();
  });

  it("no hace nada si no hay usuario autenticado", async () => {
    useAuthStore.setState({ user: null });
    const { result } = renderSubmitSales([makeSale()]);

    await act(() => result.current.submitPendingSales());

    expect(mockCreateSale).not.toHaveBeenCalled();
    expect(clearPendingSales).not.toHaveBeenCalled();
  });

  it("envía las ventas con el payload correcto", async () => {
    mockCreateSale.mockResolvedValue(undefined);
    const sale = makeSale();
    const { result } = renderSubmitSales([sale]);

    await act(() => result.current.submitPendingSales());

    expect(mockCreateSale).toHaveBeenCalledWith(BUSINESS_ID, {
      p_items: [
        {
          product_id: "prod-1",
          quantity: 2,
          price_usd: 60,
          price_ves: 2400,
        },
      ],
      p_exchange_rate: 40,
    });
    expect(clearPendingSales).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("envía una sola Venta con múltiples Renglones", async () => {
    mockCreateSale.mockResolvedValue(undefined);
    const { result } = renderSubmitSales([
      makeSale({ tempId: "s1", productId: "prod-1" }),
      makeSale({ tempId: "s2", productId: "prod-2" }),
    ]);

    await act(() => result.current.submitPendingSales());

    expect(mockCreateSale).toHaveBeenCalledTimes(1);
    expect(mockCreateSale).toHaveBeenCalledWith(
      BUSINESS_ID,
      expect.objectContaining({
        p_items: expect.arrayContaining([
          expect.objectContaining({ product_id: "prod-1" }),
          expect.objectContaining({ product_id: "prod-2" }),
        ]),
      }),
    );
  });
});
