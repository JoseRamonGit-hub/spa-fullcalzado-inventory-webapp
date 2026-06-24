import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useSubmitReturn } from "./use-submit-return";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { PendingReturnItem, PendingExchangeItem } from "../types";
import type { ReactNode } from "react";
import type { User } from "@/types";

vi.mock("sonner", () => ({
  toast: { promise: vi.fn() },
}));

vi.mock("@/services/returnsService", () => ({
  returnsService: { processReturn: vi.fn() },
}));

const { returnsService } = await import("@/services/returnsService");
const mockProcessReturn = vi.mocked(returnsService.processReturn);

const mockUser = {
  id: "user-123",
  email: "test@test.com",
  fullname: "Test",
  role: "admin",
  created_at: "",
} as User;
const BUSINESS_ID = "business-1";

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSubmitReturn", () => {
  const clearAll = vi.fn();
  const onSuccess = vi.fn();
  const currentExchangeRate = 40;
  const notes = "Producto defectuoso";

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
    useBusinessStore.setState({ activeBusinessId: BUSINESS_ID });
  });

  function renderSubmitReturn(
    returnItems: PendingReturnItem[],
    exchangeItems: PendingExchangeItem[] = [],
    returnType: "exchange" | "refund" = "refund",
  ) {
    return renderHook(
      () =>
        useSubmitReturn({
          returnItems,
          exchangeItems,
          returnType,
          currentExchangeRate,
          notes,
          clearAll,
          onSuccess,
        }),
      { wrapper: createWrapper() },
    );
  }

  it("no hace nada si no hay usuario autenticado", async () => {
    useAuthStore.setState({ user: null });
    const { result } = renderSubmitReturn([makeReturnItem()]);

    await act(() => result.current.submitReturn());

    expect(mockProcessReturn).not.toHaveBeenCalled();
    expect(clearAll).not.toHaveBeenCalled();
  });

  it("no hace nada si no hay items de devolución", async () => {
    const { result } = renderSubmitReturn([]);

    await act(() => result.current.submitReturn());

    expect(mockProcessReturn).not.toHaveBeenCalled();
    expect(clearAll).not.toHaveBeenCalled();
  });

  it("envía una devolución (refund) con el payload correcto", async () => {
    mockProcessReturn.mockResolvedValue(undefined);
    const returnItem = makeReturnItem();
    const { result } = renderSubmitReturn([returnItem], [], "refund");

    await act(() => result.current.submitReturn());

    expect(mockProcessReturn).toHaveBeenCalledWith(BUSINESS_ID, {
      p_type: "refund",
      p_returned_items: [{ product_id: "prod-1", quantity: 1, price_usd: 60, price_ves: 2400 }],
      p_new_items: null,
      p_exchange_rate: 40,
      p_notes: "Producto defectuoso",
    });
    expect(clearAll).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("envía un intercambio (exchange) con items nuevos", async () => {
    mockProcessReturn.mockResolvedValue(undefined);
    const returnItem = makeReturnItem();
    const exchangeItem = makeExchangeItem();
    const { result } = renderSubmitReturn([returnItem], [exchangeItem], "exchange");

    await act(() => result.current.submitReturn());

    expect(mockProcessReturn).toHaveBeenCalledWith(BUSINESS_ID, {
      p_type: "exchange",
      p_returned_items: [{ product_id: "prod-1", quantity: 1, price_usd: 60, price_ves: 2400 }],
      p_new_items: [{ product_id: "prod-2", quantity: 1, price_usd: 80, price_ves: 3200 }],
      p_exchange_rate: 40,
      p_notes: "Producto defectuoso",
    });
  });

  it("envía p_notes como undefined cuando notes está vacío", async () => {
    mockProcessReturn.mockResolvedValue(undefined);
    const { result } = renderHook(
      () =>
        useSubmitReturn({
          returnItems: [makeReturnItem()],
          exchangeItems: [],
          returnType: "refund",
          currentExchangeRate: 40,
          notes: "",
          clearAll,
          onSuccess,
        }),
      { wrapper: createWrapper() },
    );

    await act(() => result.current.submitReturn());

    expect(mockProcessReturn).toHaveBeenCalledWith(BUSINESS_ID, expect.objectContaining({ p_notes: undefined }));
  });
});
