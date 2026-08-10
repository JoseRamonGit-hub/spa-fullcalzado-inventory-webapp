import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { useProductHistory } from "./useProductHistory";
import type { ProductHistoryRange } from "../product-history-filter";

vi.mock("@/services/inventoryMovementsService", () => ({
  inventoryMovementsService: {
    getProductHistory: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("useProductHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBusinessStore.setState({ activeBusinessId: "business-1" });
  });

  it("keeps each selected period in a separate product-history query", async () => {
    const last30Days: ProductHistoryRange = {
      startDate: "2026-07-10",
      endDate: "2026-08-08",
      showAll: false,
    };
    const last90Days: ProductHistoryRange = {
      startDate: "2026-05-11",
      endDate: "2026-08-08",
      showAll: false,
    };
    vi.mocked(inventoryMovementsService.getProductHistory).mockResolvedValue([]);

    const { result, rerender } = renderHook(({ range }) => useProductHistory("product-1", range), {
      initialProps: { range: last30Days },
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(inventoryMovementsService.getProductHistory).toHaveBeenCalledWith("business-1", "product-1", last30Days);

    rerender({ range: last90Days });

    await waitFor(() =>
      expect(inventoryMovementsService.getProductHistory).toHaveBeenCalledWith("business-1", "product-1", last90Days),
    );
  });

  it("does not request history until a custom range is valid", () => {
    renderHook(() => useProductHistory("product-1", null), { wrapper });

    expect(inventoryMovementsService.getProductHistory).not.toHaveBeenCalled();
  });
});
