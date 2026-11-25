import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { transactionsService } from "./transactionsService";

const mockRpc = vi.mocked(supabase.rpc);

const SALE_PAYLOAD = {
  p_items: [{ product_id: "prod-1", quantity: 2, price_usd: 60, price_ves: 2400 }],
  p_exchange_rate: 40,
};

const CASHEA_ORDER = {
  order_number: "6400685",
  invoice_number: "551-000738",
  total_usd: 120,
  paid_today_usd: 60,
  financed_usd: 60,
};

describe("transactionsService.createSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: "sale-1", error: null } as never);
  });

  it("registra una Venta sin Cashea con create_sale", async () => {
    await transactionsService.createSale("business-1", SALE_PAYLOAD);

    expect(mockRpc).toHaveBeenCalledWith("create_sale", {
      p_business_id: "business-1",
      p_items: SALE_PAYLOAD.p_items,
      p_exchange_rate: 40,
    });
  });

  it("registra una Venta Cashea con create_cashea_sale y los datos de la Orden Cashea", async () => {
    await transactionsService.createSale("business-1", { ...SALE_PAYLOAD, p_cashea: CASHEA_ORDER });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("create_cashea_sale", {
      p_business_id: "business-1",
      p_items: SALE_PAYLOAD.p_items,
      p_exchange_rate: 40,
      p_cashea: CASHEA_ORDER,
    });
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

  it("conserva el código del error al rechazar una Venta Cashea", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Ya existe una Orden Cashea con ese número en este negocio",
        code: "P0001",
        details: null,
        hint: null,
      },
    } as never);

    await expect(
      transactionsService.createSale("business-1", { ...SALE_PAYLOAD, p_cashea: CASHEA_ORDER }),
    ).rejects.toMatchObject({
      message: "Ya existe una Orden Cashea con ese número en este negocio",
      code: "P0001",
    });
  });
});
