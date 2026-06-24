import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTransactions, useTodayTransactions, transactionKeys } from "./useTransactionQueries";
import { useCreateManyTransactions } from "./useTransactionMutations";
import { transactionsService } from "@/services/transactionsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";
import type { TransactionWithRelations } from "@/types";

const BUSINESS_ID = "business-1";

vi.mock("@/services/transactionsService", () => ({
  transactionsService: {
    getAll: vi.fn(),
    getToday: vi.fn(),
    createMany: vi.fn(),
  },
}));

const fakeTransaction = {
  id: "tx-1",
  product_id: "prod-1",
  quantity: 2,
  price_usd: 20,
  price_ves: 700,
  exchange_rate: 35,
  user_id: "user-1",
  created_at: "2026-03-16T10:00:00Z",
} as TransactionWithRelations;

let testQueryClient: QueryClient;

beforeEach(() => {
  testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.clearAllMocks();
  useBusinessStore.setState({
    userId: "user-1",
    activeBusinessId: BUSINESS_ID,
    selectedBusinessByUser: {},
  });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
);

describe("useTransactions Hook", () => {
  describe("Queries", () => {
    it("debe obtener todas las transacciones usando list fetcher", async () => {
      vi.mocked(transactionsService.getAll).mockResolvedValueOnce([fakeTransaction]);

      const { result } = renderHook(() => useTransactions(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(transactionsService.getAll).toHaveBeenCalledWith(BUSINESS_ID, undefined);
      expect(result.current.data).toEqual([fakeTransaction]);
    });

    it("debe obtener transacciones filtradas por default parameter", async () => {
      vi.mocked(transactionsService.getAll).mockResolvedValueOnce([]);

      const testDate = "2026-03-16";
      const { result } = renderHook(() => useTransactions(testDate), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(transactionsService.getAll).toHaveBeenCalledWith(BUSINESS_ID, testDate);
    });

    it("debe obtener solo las transacciones del día actual", async () => {
      vi.mocked(transactionsService.getToday).mockResolvedValueOnce([fakeTransaction]);

      const { result } = renderHook(() => useTodayTransactions(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(transactionsService.getToday).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result.current.data).toEqual([fakeTransaction]);
    });
  });

  describe("Mutations", () => {
    it("useCreateManyTransactions debe invalidar caché correctamente en inserts bultos", async () => {
      vi.mocked(transactionsService.createMany).mockResolvedValueOnce([]);
      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateManyTransactions(), { wrapper });

      const payload = [
        { product_id: "prod-1", quantity: 2, user_id: "user-1", price_usd: 10, price_ves: 350, exchange_rate: 35 },
      ];
      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(transactionsService.createMany).toHaveBeenCalledWith(BUSINESS_ID, payload);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.business(BUSINESS_ID) });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["products", BUSINESS_ID] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: movementKeys.business(BUSINESS_ID) });
    });
  });
});
