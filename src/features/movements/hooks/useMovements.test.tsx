import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMovements, movementKeys } from "./useMovementQueries";
import { useCreateManyMovements } from "./useMovementMutations";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { InventoryMovementWithRelations } from "@/types";

const BUSINESS_ID = "business-1";

vi.mock("@/services/inventoryMovementsService", () => ({
  inventoryMovementsService: {
    getAll: vi.fn(),
    createMany: vi.fn(),
  },
}));

const fakeMovement = {
  id: "mov-1",
  business_id: BUSINESS_ID,
  product_id: "prod-1",
  type: "entry",
  quantity: 5,
  price_usd: 10,
  price_usd_before: null,
  description_before: null,
  stock_before: 0,
  return_id: null,
  user_id: "user-1",
  date: "2026-01-01",
  time: "10:00:00",
  created_at: "2026-01-01T00:00:00Z",
  products: { code: "SHO-01", description: "Zapatos" },
  users: { fullname: "Test User" },
} satisfies InventoryMovementWithRelations;

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

describe("useMovements Hook", () => {
  describe("useMovements (Query)", () => {
    it("debe obtener los movimientos exitosamente usando la default key", async () => {
      vi.mocked(inventoryMovementsService.getAll).mockResolvedValueOnce([fakeMovement]);

      const { result } = renderHook(() => useMovements(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(inventoryMovementsService.getAll).toHaveBeenCalledWith(BUSINESS_ID, undefined);
      expect(result.current.data).toEqual([fakeMovement]);
    });

    it("debe obtener los movimientos filtrados por fecha si se pasa como argumento", async () => {
      vi.mocked(inventoryMovementsService.getAll).mockResolvedValueOnce([]);

      const testDate = "2026-03-10";
      const { result } = renderHook(() => useMovements(testDate), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(inventoryMovementsService.getAll).toHaveBeenCalledWith(BUSINESS_ID, testDate);
    });
  });

  describe("useCreateManyMovements (Mutation)", () => {
    it("debe crear movimientos exitosamente e invalidar la query keys de listado", async () => {
      vi.mocked(inventoryMovementsService.createMany).mockResolvedValueOnce([]);

      // Spy on invalidateQueries to see if cache triggers are correct
      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateManyMovements(), { wrapper });

      const payload = [{ product_id: "prod-1", quantity: 10, type: "entry" as const, user_id: "user-1" }];

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(inventoryMovementsService.createMany).toHaveBeenCalledWith(BUSINESS_ID, payload);
      // Ensure specific keys are invalidated properly
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: movementKeys.business(BUSINESS_ID) });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["products", BUSINESS_ID] });
    });
  });
});
