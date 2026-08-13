import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { DashboardServiceError, dashboardService } from "@/services/dashboardService";
import type { DashboardSalesPeriodRequest } from "@/types";
import { useDashboardSalesPeriod } from "./useDashboardMetrics";

vi.mock("@/services/dashboardService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/dashboardService")>();

  return {
    ...actual,
    dashboardService: {
      ...actual.dashboardService,
      getSalesPeriod: vi.fn(),
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useDashboardSalesPeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBusinessStore.setState({ activeBusinessId: "business-1" });
  });

  it("consulta el rango personalizado completo", async () => {
    const request = { preset: "custom", startDate: "2024-03-20", endDate: "2024-03-27" } as const;
    vi.mocked(dashboardService.getSalesPeriod).mockResolvedValue({ preset: "custom" } as never);

    const { result } = renderHook(() => useDashboardSalesPeriod(request), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(dashboardService.getSalesPeriod).toHaveBeenCalledWith("business-1", request, expect.any(AbortSignal));
  });

  it("no consulta mientras el rango personalizado esté incompleto", () => {
    renderHook(() => useDashboardSalesPeriod(null), { wrapper: createWrapper() });

    expect(dashboardService.getSalesPeriod).not.toHaveBeenCalled();
  });

  it("separa resultados al alternar entre preset y Personalizado", async () => {
    const weekRequest: DashboardSalesPeriodRequest = { preset: "week" };
    const customRequest: DashboardSalesPeriodRequest = {
      preset: "custom",
      startDate: "2024-03-20",
      endDate: "2024-03-27",
    };
    vi.mocked(dashboardService.getSalesPeriod)
      .mockResolvedValueOnce({ preset: "week" } as never)
      .mockResolvedValueOnce({ preset: "custom" } as never);
    const initialProps: { request: DashboardSalesPeriodRequest } = { request: weekRequest };

    const { result, rerender } = renderHook(
      ({ request }: { request: DashboardSalesPeriodRequest }) => useDashboardSalesPeriod(request),
      {
        initialProps,
        wrapper: createWrapper(),
      },
    );
    await waitFor(() => expect(result.current.data?.preset).toBe("week"));

    rerender({ request: customRequest });
    await waitFor(() => expect(result.current.data?.preset).toBe("custom"));

    rerender({ request: weekRequest });
    await waitFor(() => expect(result.current.data?.preset).toBe("week"));
    expect(dashboardService.getSalesPeriod).toHaveBeenCalledTimes(2);
  });

  it("cancela la solicitud anterior al cambiar de período", async () => {
    let firstSignal: AbortSignal | undefined;
    vi.mocked(dashboardService.getSalesPeriod).mockImplementation((_businessId, request, signal) => {
      if (request.preset === "week") {
        firstSignal = signal;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
        });
      }

      return Promise.resolve({ preset: "month" } as never);
    });

    const { result, rerender } = renderHook(
      ({ request }: { request: DashboardSalesPeriodRequest }) => useDashboardSalesPeriod(request),
      {
        initialProps: { request: { preset: "week" } },
        wrapper: createWrapper(),
      },
    );
    await waitFor(() => expect(firstSignal).toBeInstanceOf(AbortSignal));

    rerender({ request: { preset: "month" } });

    await waitFor(() => expect(firstSignal?.aborted).toBe(true));
    await waitFor(() => expect(result.current.data?.preset).toBe("month"));
  });

  it("no repite automáticamente errores de acceso", async () => {
    vi.mocked(dashboardService.getSalesPeriod).mockRejectedValue(
      new DashboardServiceError("permission denied", "access"),
    );

    const { result } = renderHook(() => useDashboardSalesPeriod({ preset: "week" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(dashboardService.getSalesPeriod).toHaveBeenCalledOnce();
  });
});
