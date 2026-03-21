import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMovements, movementKeys } from "./useMovementQueries";
import { useCreateManyMovements } from "./useMovementMutations";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";

vi.mock("@/services/inventoryMovementsService", () => ({
  inventoryMovementsService: {
    getAll: vi.fn(),
    createMany: vi.fn(),
  },
}));

const fakeMovement = {
  id: "mov-1",
  product_id: "prod-1",
  type: "entry",
  quantity: 5,
  price_usd: 10,
  price_ves: 350,
  exchange_rate: 35,
  user_id: "user-1",
  created_at: "2026-01-01T00:00:00Z",
} as any;

let testQueryClient: QueryClient;

beforeEach(() => {
  testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.clearAllMocks();
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

      expect(inventoryMovementsService.getAll).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual([fakeMovement]);
    });

    it("debe obtener los movimientos filtrados por fecha si se pasa como argumento", async () => {
      vi.mocked(inventoryMovementsService.getAll).mockResolvedValueOnce([]);

      const testDate = "2026-03-10";
      const { result } = renderHook(() => useMovements(testDate), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(inventoryMovementsService.getAll).toHaveBeenCalledWith(testDate);
    });
  });

  describe("useCreateManyMovements (Mutation)", () => {
    it("debe crear movimientos exitosamente e invalidar la query keys de listado", async () => {
      vi.mocked(inventoryMovementsService.createMany).mockResolvedValueOnce([] as any);

      // Spy on invalidateQueries to see if cache triggers are correct
      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateManyMovements(), { wrapper });

      const payload = [{ product_id: "prod-1", quantity: 10, type: "entry" as const, user_id: "user-1" }];

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(inventoryMovementsService.createMany).toHaveBeenCalledWith(payload);
      // Ensure specific keys are invalidated properly
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: movementKeys.all });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["products"] });
    });
  });
});
