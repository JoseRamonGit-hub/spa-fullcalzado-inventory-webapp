import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useSubmitSale } from "./use-submit-sale";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { PendingSaleLine } from "../types";
import type { ReactNode } from "react";
import type { CasheaOrderInput, User } from "@/types";
import { toast } from "sonner";
import { ServiceError } from "@/lib/errors";

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSubmitSale", () => {
  const clearPendingSaleLines = vi.fn();
  const onSuccess = vi.fn();
  const currentExchangeRate = 40;

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
    useBusinessStore.setState({ activeBusinessId: BUSINESS_ID });
  });

  function renderSubmitSale(pendingSaleLines: PendingSaleLine[], casheaOrder: CasheaOrderInput | null = null) {
    return renderHook(
      () => useSubmitSale({ pendingSaleLines, currentExchangeRate, casheaOrder, clearPendingSaleLines, onSuccess }),
      { wrapper: createWrapper() },
    );
  }

  it("no hace nada si no hay renglones pendientes", async () => {
    const { result } = renderSubmitSale([]);

    await act(() => result.current.submitSale());

    expect(mockCreateSale).not.toHaveBeenCalled();
    expect(clearPendingSaleLines).not.toHaveBeenCalled();
  });

  it("no hace nada si no hay usuario autenticado", async () => {
    useAuthStore.setState({ user: null });
    const { result } = renderSubmitSale([makeSaleLine()]);

    await act(() => result.current.submitSale());

    expect(mockCreateSale).not.toHaveBeenCalled();
    expect(clearPendingSaleLines).not.toHaveBeenCalled();
  });

  it("envía el renglón con el payload correcto", async () => {
    mockCreateSale.mockResolvedValue(undefined);
    const saleLine = makeSaleLine();
    const { result } = renderSubmitSale([saleLine]);

    await act(() => result.current.submitSale());

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
    expect(clearPendingSaleLines).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("envía una sola Venta con múltiples Renglones", async () => {
    mockCreateSale.mockResolvedValue(undefined);
    const { result } = renderSubmitSale([
      makeSaleLine({ tempId: "s1", productId: "prod-1" }),
      makeSaleLine({ tempId: "s2", productId: "prod-2" }),
    ]);

    await act(() => result.current.submitSale());

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

  it("envía la Orden Cashea junto con los Renglones en una Venta Cashea", async () => {
    mockCreateSale.mockResolvedValue(undefined);
    const casheaOrder: CasheaOrderInput = {
      order_number: "6400685",
      invoice_number: "551-000738",
      total_usd: 120,
      paid_today_usd: 60,
      financed_usd: 60,
    };
    const { result } = renderSubmitSale([makeSaleLine()], casheaOrder);

    await act(() => result.current.submitSale());

    expect(mockCreateSale).toHaveBeenCalledWith(BUSINESS_ID, {
      p_items: [{ product_id: "prod-1", quantity: 2, price_usd: 60, price_ves: 2400 }],
      p_exchange_rate: 40,
      p_cashea: casheaOrder,
    });
    expect(clearPendingSaleLines).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  describe("mensaje de error de la venta", () => {
    async function submitRejectedSale(rejection: unknown) {
      mockCreateSale.mockRejectedValue(rejection);
      const { result } = renderSubmitSale([makeSaleLine()]);

      await act(() => result.current.submitSale().catch(() => {}));

      const toastOptions = vi.mocked(toast.promise).mock.calls[0][1];
      const errorOption = toastOptions?.error;
      return typeof errorOption === "function" ? errorOption(rejection) : errorOption;
    }

    it("muestra el mensaje del servidor cuando una regla de negocio rechaza la venta", async () => {
      const message = await submitRejectedSale(
        new ServiceError("Existencia insuficiente para el producto SHO-01", "P0001"),
      );

      expect(message).toBe("Existencia insuficiente para el producto SHO-01");
      expect(clearPendingSaleLines).not.toHaveBeenCalled();
    });

    it("muestra el mensaje genérico cuando el error tiene otro código", async () => {
      const message = await submitRejectedSale(new ServiceError("duplicate key value", "23505"));

      expect(message).toBe("No se pudo registrar la venta. Revisa la conexión e intenta de nuevo.");
    });

    it("muestra el mensaje genérico ante un fallo de red", async () => {
      const message = await submitRejectedSale(new TypeError("Failed to fetch"));

      expect(message).toBe("No se pudo registrar la venta. Revisa la conexión e intenta de nuevo.");
    });
  });
});
