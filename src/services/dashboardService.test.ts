import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardService } from "./dashboardService";

const rpc = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc },
}));

const validSalesPeriodRow = {
  current_start: "2024-03-20",
  current_end: "2024-03-27",
  comparison_start: "2024-03-12",
  comparison_end: "2024-03-19",
  current_total_usd: 9_999_999_999.99,
  previous_total_usd: 50,
  current_operations: 2,
  previous_operations: 1,
  average_ticket_usd: 4_999_999_999.995,
  previous_average_ticket_usd: 50,
  bucket_index: 0,
  bucket_label: "20/03/24–26/03/24",
  bucket_start: "2024-03-20",
  bucket_end: "2024-03-26",
  is_available: true,
  bucket_total_usd: 9_999_999_999.99,
  comparison_bucket_start: "2024-03-12",
  comparison_bucket_end: "2024-03-18",
  comparison_bucket_total_usd: 50,
};

const validTopProductRow = {
  rank: 1,
  product_id: "product-1",
  code: "CODIGO-EXTENSO-1234567890",
  description: "Descripción válida",
  units: 3,
  gross_usd: 75,
  participation_percentage: 60,
};

function mockRpcResult(data: unknown, error: unknown = null) {
  const abortSignal = vi.fn().mockReturnValue(Promise.resolve({ data, error }));
  rpc.mockReturnValue({ abortSignal });
  return abortSignal;
}

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conserva importes grandes válidos y conecta la cancelación", async () => {
    const abortSignal = mockRpcResult([validSalesPeriodRow]);
    const signal = new AbortController().signal;

    const result = await dashboardService.getSalesPeriod("business-1", { preset: "week" }, signal);

    expect(result.totalUsd).toBe(9_999_999_999.99);
    expect(result.buckets[0]?.totalUsd).toBe(9_999_999_999.99);
    expect(abortSignal).toHaveBeenCalledWith(signal);
  });

  it("rechaza respuestas con importes no finitos en vez de mostrarlos como cero", async () => {
    mockRpcResult([{ ...validSalesPeriodRow, current_total_usd: Number.NaN }]);

    await expect(
      dashboardService.getSalesPeriod("business-1", { preset: "week" }, new AbortController().signal),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("rechaza participaciones fuera del rango porcentual", async () => {
    mockRpcResult([{ ...validTopProductRow, participation_percentage: 120 }]);

    await expect(
      dashboardService.getTopProducts("business-1", { preset: "week" }, "units", new AbortController().signal),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it.each([
    [{ message: "Failed to fetch", code: "" }, "network"],
    [{ message: "permission denied for function", code: "42501" }, "access"],
  ] as const)("clasifica el error de servicio como %s", async (error, kind) => {
    mockRpcResult(null, error);

    await expect(
      dashboardService.getTopProducts("business-1", { preset: "week" }, "units", new AbortController().signal),
    ).rejects.toMatchObject({ kind });
  });
});
