import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { inventoryMovementsService } from "@/services/inventoryMovementsService";
import { useProductHistory } from "./useProductHistory";

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

  it("requests the audited history for the product in the active business", async () => {
    vi.mocked(inventoryMovementsService.getProductHistory).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useProductHistory("product-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(inventoryMovementsService.getProductHistory).toHaveBeenCalledWith("business-1", "product-1");
  });
});
