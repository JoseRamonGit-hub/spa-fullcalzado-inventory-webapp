import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useProducts, productKeys } from "./useProductQueries";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "./useProductMutations";
import { productsService } from "@/services/productsService";
import type { Product, ProductInsert, EditProductPayload } from "@/types";
import type { ReactNode } from "react";

// Mock the entire service
vi.mock("@/services/productsService", () => ({
  productsService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    editProduct: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGetAll = vi.mocked(productsService.getAll);
const mockCreate = vi.mocked(productsService.create);
const mockEditProduct = vi.mocked(productsService.editProduct);
const mockDelete = vi.mocked(productsService.delete);

const fakeProduct: Product = {
  id: "prod-1",
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
      expect(mockGetAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("Mutations", () => {
    it("create product invalidates lists query", async () => {
      mockCreate.mockResolvedValueOnce(fakeProduct);

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(),
      });

      // Spy on queryClient invalidateQueries
      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      const insertData: ProductInsert = { code: "SHO-01", description: "Zapatos Nike", price_usd: 120, stock: 10 };

      act(() => {
        result.current.mutate(insertData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCreate).toHaveBeenCalledWith(insertData);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.lists() });
    });

    it("update product invalidates lists, detail, and movements", async () => {
      mockEditProduct.mockResolvedValueOnce({});

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
        p_user_id: "user-1",
      };

      act(() => {
        result.current.mutate(editPayload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEditProduct).toHaveBeenCalledWith(editPayload);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.detail("prod-1") });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.lists() });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["movements"] });
    });

    it("delete product invalidates lists and specific detail query", async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(),
      });

      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      act(() => {
        result.current.mutate("prod-1");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDelete).toHaveBeenCalledWith("prod-1");
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.detail("prod-1") });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.lists() });
    });
  });
});
