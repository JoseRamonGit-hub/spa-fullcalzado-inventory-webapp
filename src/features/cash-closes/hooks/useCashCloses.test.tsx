import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCashCloses } from "./useCashCloseQueries";
import { cashClosesService } from "@/services/cashClosesService";

vi.mock("@/services/cashClosesService", () => ({
  cashClosesService: {
    getAll: vi.fn(),
  },
}));

const fakeCashClose = {
  id: "close-1",
  closed_at: "2026-03-16T10:00:00Z",
  total_transactions: 10,
  total_units_sold: 15,
  total_usd: 150,
  total_ves: 5000,
  user_id: "user-1",
  closed_by: "Admin User",
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

describe("useCashCloses Hook", () => {
  it("debe obtener los cierres de caja (fecha undefined)", async () => {
    vi.mocked(cashClosesService.getAll).mockResolvedValueOnce([fakeCashClose]);

    const { result } = renderHook(() => useCashCloses(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(cashClosesService.getAll).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual([fakeCashClose]);
  });

  it("debe obtener los cierres filtrados al recibir parametro de fecha", async () => {
    vi.mocked(cashClosesService.getAll).mockResolvedValueOnce([]);

    const testDate = "2026-03-16";
    const { result } = renderHook(() => useCashCloses(testDate), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(cashClosesService.getAll).toHaveBeenCalledWith(testDate);
    expect(result.current.data).toEqual([]);
  });
});
