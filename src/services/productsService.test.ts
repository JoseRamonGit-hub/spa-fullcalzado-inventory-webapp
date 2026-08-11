import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { productsService } from "./productsService";

const mockRpc = vi.mocked(supabase.rpc);

describe("productsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves stagnation data returned by the stock alerts query", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          active: true,
          alert_rank: 1,
          alert_type: "stagnant",
          business_id: "business-1",
          code: "OLD-01",
          created_at: "2026-01-01T00:00:00Z",
          description: "Producto estancado",
          price_usd: 25,
          product_id: "product-1",
          stagnant_days: 40,
          stagnant_since: "2026-07-02",
          stock: 8,
          updated_at: "2026-08-01T00:00:00Z",
        },
      ],
      error: null,
    } as never);

    await expect(productsService.getAll("business-1", undefined, "stagnant")).resolves.toEqual([
      expect.objectContaining({
        id: "product-1",
        stagnantSince: "2026-07-02",
        stagnantDays: 40,
      }),
    ]);
  });
});
