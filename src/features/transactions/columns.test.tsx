import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/ui/data-table";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TransactionWithRelations } from "@/types";
import { columns } from "./columns";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

function makeTransaction(overrides: Partial<TransactionWithRelations>): TransactionWithRelations {
  return {
    id: "line-1",
    business_id: "business-1",
    sale_id: "sale-1",
    return_id: null,
    product_id: "product-1",
    quantity: 1,
    price_usd: 50,
    price_ves: 4_500,
    total_usd: 50,
    total_ves: 4_500,
    exchange_rate: 90,
    user_id: "user-1",
    date: "2026-11-12",
    time: "10:00:00",
    created_at: "2026-11-12T14:00:00Z",
    products: { code: "FC-01", description: "Producto 1" },
    users: { fullname: "Cajero" },
    sales: { cashea_orders: [] },
    ...overrides,
  };
}

function renderRows(data: TransactionWithRelations[]) {
  render(
    <TooltipProvider>
      <DataTable columns={columns} data={data} hidePagination />
    </TooltipProvider>,
  );
  return screen.getAllByRole("row").slice(1);
}

describe("columnas de Ventas", () => {
  it("marca cada Renglón de una Venta Cashea con el número de orden en el title", () => {
    const sales = { cashea_orders: [{ order_number: "6400685", status: "pending" as const }] };
    const rows = renderRows([
      makeTransaction({ id: "line-1", sales }),
      makeTransaction({ id: "line-2", product_id: "product-2", products: { code: "FC-02", description: "P2" }, sales }),
    ]);

    for (const row of rows) {
      const badge = within(row).getByText("Cashea");
      expect(badge.closest("[title]")).toHaveAttribute("title", "Venta Cashea · Orden 6400685");
    }
  });

  it("usa la Orden Cashea vigente e ignora las anuladas", () => {
    const rows = renderRows([
      makeTransaction({
        sales: {
          cashea_orders: [
            { order_number: "6400600", status: "voided" },
            { order_number: "6400601", status: "collected" },
          ],
        },
      }),
    ]);

    expect(within(rows[0]).getByText("Cashea").closest("[title]")).toHaveAttribute(
      "title",
      "Venta Cashea · Orden 6400601",
    );
  });

  it("no marca las Ventas sin Orden Cashea vigente ni los Renglones sin Venta", () => {
    const rows = renderRows([
      makeTransaction({ id: "line-1", sales: { cashea_orders: [{ order_number: "6400600", status: "voided" }] } }),
      makeTransaction({ id: "line-2", sale_id: "sale-2", sales: { cashea_orders: [] } }),
      makeTransaction({ id: "line-3", sale_id: null, sales: null }),
    ]);

    for (const row of rows) {
      expect(within(row).queryByText("Cashea")).not.toBeInTheDocument();
    }
  });
});
