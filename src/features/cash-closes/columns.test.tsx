import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/ui/data-table";
import type { CashCloseWithRelations } from "@/types";
import { columns } from "./columns";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

const baseCashClose = {
  business_id: "business-1",
  closed_at: "2026-08-08T18:00:00Z",
  closed_by: "user-1",
  date: "2026-08-08",
  exchange_rate: 90,
  total_returns: 0,
  total_returns_usd: 0,
  total_returns_ves: 0,
  total_transactions: 7,
  total_units_sold: 9,
  total_usd: 180,
  total_ves: 16200,
  users: { fullname: "María" },
} satisfies Omit<CashCloseWithRelations, "id" | "total_billed_operations">;

describe("columnas de Cierres de Caja", () => {
  it("muestra el conteo exacto nuevo y usa el valor heredado cuando falta", () => {
    const data: CashCloseWithRelations[] = [
      { ...baseCashClose, id: "new-close", total_billed_operations: 2 },
      { ...baseCashClose, id: "historical-close", total_billed_operations: null },
    ];

    render(<DataTable columns={columns} data={data} hidePagination />);

    expect(screen.getByRole("button", { name: /Operaciones facturadas/i })).toBeInTheDocument();
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("2")).toBeInTheDocument();
    expect(within(rows[1]).getByText("7")).toBeInTheDocument();
    expect(screen.queryByTitle(/heredad|históric/i)).not.toBeInTheDocument();
  });
});
