import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, productKeys } from "./useProducts";
import { productsService } from "@/services/productsService";
import type { Product, ProductInsert, ProductUpdate } from "@/types";
import type { ReactNode } from "react";

// Mock the entire service
vi.mock("@/services/productsService", () => ({
  productsService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGetAll = vi.mocked(productsService.getAll);
const mockCreate = vi.mocked(productsService.create);
const mockUpdate = vi.mocked(productsService.update);
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

    it("update product invalidates lists and specific detail query", async () => {
      mockUpdate.mockResolvedValueOnce(fakeProduct);

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(),
      });

      const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");

      const updateData: ProductUpdate = { price_usd: 150 };

      act(() => {
        result.current.mutate({ id: "prod-1", payload: updateData });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdate).toHaveBeenCalledWith("prod-1", updateData);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.detail("prod-1") });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: productKeys.lists() });
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
