import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { transactionsService } from "./transactionsService";

const mockRpc = vi.mocked(supabase.rpc);

const SALE_PAYLOAD = {
  p_items: [{ product_id: "prod-1", quantity: 2, price_usd: 60, price_ves: 2400 }],
  p_exchange_rate: 40,
};

describe("transactionsService.createSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conserva el mensaje y el código del error de Supabase al rechazar la venta", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Existencia insuficiente para el producto SHO-01",
        code: "P0001",
        details: null,
        hint: null,
      },
    } as never);

    await expect(transactionsService.createSale("business-1", SALE_PAYLOAD)).rejects.toMatchObject({
      message: "Existencia insuficiente para el producto SHO-01",
      code: "P0001",
    });
  });
});
