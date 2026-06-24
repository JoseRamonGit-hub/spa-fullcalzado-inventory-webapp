import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useProducts, productKeys } from "./useProductQueries";
import { useUpdateProduct, useToggleProductActive } from "./useProductMutations";
import { productsService } from "@/services/productsService";
import type { Product, EditProductPayload } from "@/types";
import type { ReactNode } from "react";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { movementKeys } from "@/features/movements/hooks/useMovementQueries";

const BUSINESS_ID = "business-1";

// Mock the entire service
vi.mock("@/services/productsService", () => ({
  productsService: {
    getAll: vi.fn(),
    editProduct: vi.fn(),
    createMany: vi.fn(),
    toggleActive: vi.fn(),
  },
}));

const mockGetAll = vi.mocked(productsService.getAll);
const mockEditProduct = vi.mocked(productsService.editProduct);
const mockToggleActive = vi.mocked(productsService.toggleActive);

const fakeProduct: Product = {
  id: "prod-1",
  business_id: BUSINESS_ID,
  code: "SHO-01",
  description: "Zapatos Nike",
  price_usd: 120,
  stock: 10,
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

let testQueryClient: QueryClient;

function createWrapper() {
  testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
  };
}

describe("useProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBusinessStore.setState({
      userId: "user-1",
      activeBusinessId: BUSINESS_ID,
      selectedBusinessByUser: {},
    });
  });

  describe("Queries", () => {
    it("fetch successfully", async () => {
      mockGetAll.mockResolvedValueOnce([fakeProduct]);

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([fakeProduct]);
      expect(mockGetAll).toHaveBeenCalledWith(BUSINESS_ID, undefined);
    });
  });

  describe("Mutations", () => {
    it("update product invalidates lists, detail, and movements", async () => {
      mockEditProduct.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(),
      });

      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      const editPayload: EditProductPayload = {
        p_product_id: "prod-1",
        p_code: "SHO-01",
        p_description: "Zapatos Nike",
        p_price_usd: 150,
        p_stock: 10,
      };

      act(() => {
        result.current.mutate(editPayload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEditProduct).toHaveBeenCalledWith(BUSINESS_ID, editPayload);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.lists(BUSINESS_ID) });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: movementKeys.business(BUSINESS_ID) });
    });

    it("toggle product active invalidates product lists", async () => {
      mockToggleActive.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useToggleProductActive(), {
        wrapper: createWrapper(),
      });

      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      act(() => {
        result.current.mutate({ id: "prod-1", active: false });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToggleActive).toHaveBeenCalledWith(BUSINESS_ID, "prod-1", false);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.lists(BUSINESS_ID) });
    });
  });
});
