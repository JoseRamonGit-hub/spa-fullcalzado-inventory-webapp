import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cashCloseKeys } from "@/features/cash-closes/hooks/useCashCloseQueries";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { returnsService } from "@/services/returnsService";
import { useCreateReturn } from "./useReturnMutations";

const BUSINESS_ID = "business-1";

vi.mock("@/services/returnsService", () => ({
  returnsService: {
    processReturn: vi.fn(),
  },
}));

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

describe("useCreateReturn", () => {
  it("invalida el resumen del Cierre de Caja después de una devolución o Cambio", async () => {
    vi.mocked(returnsService.processReturn).mockResolvedValueOnce(undefined);
    const invalidateSpy = vi.spyOn(testQueryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateReturn(), { wrapper });
    const payload = {
      p_type: "exchange" as const,
      p_returned_items: [{ product_id: "product-1", quantity: 1, price_usd: 20, price_ves: 1800 }],
      p_new_items: [{ product_id: "product-2", quantity: 1, price_usd: 30, price_ves: 2700 }],
      p_exchange_rate: 90,
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(returnsService.processReturn).toHaveBeenCalledWith(BUSINESS_ID, payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cashCloseKeys.summaries(BUSINESS_ID) });
  });
});
