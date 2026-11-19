import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/ui/data-table";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { CashCloseWithRelations } from "@/types";
import { formatCurrencyUSD } from "@/utils/formatters";
import { buildCashCloseHistory } from "./cash-close-ledger";
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
  cashea_receivable_usd: null,
  cashea_receivable_ves: null,
  cashea_voided_return_usd: null,
  cashea_voided_return_ves: null,
  users: { fullname: "María" },
} satisfies Omit<CashCloseWithRelations, "id" | "total_billed_operations">;

describe("columnas de Cierres de Caja", () => {
  it("muestra el conteo exacto nuevo y usa el valor heredado cuando falta", () => {
    const data = buildCashCloseHistory({
      cashCloses: [
        { ...baseCashClose, id: "new-close", total_billed_operations: 2 },
        { ...baseCashClose, id: "historical-close", total_billed_operations: null },
      ],
      unclosedDays: [],
      casheaStatuses: [],
    });

    render(
      <TooltipProvider>
        <DataTable columns={columns} data={data} hidePagination />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: /^Ordenar Operaciones de forma /i })).toBeInTheDocument();
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("2")).toBeInTheDocument();
    expect(within(rows[1]).getByText("7")).toBeInTheDocument();
    expect(screen.queryByTitle(/heredad|históric/i)).not.toBeInTheDocument();
  });

  it.each([false, true])("conserva las columnas y el cobro Cashea (móvil: %s)", (isMobile) => {
    const matchMedia = vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: isMobile,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const close = { ...baseCashClose, total_billed_operations: 2, total_returns: 1, total_returns_usd: 57 };
    const data = buildCashCloseHistory({
      cashCloses: [
        { ...close, id: "mixed", date: "2026-08-08", cashea_receivable_usd: 40 },
        { ...close, id: "pending", date: "2026-08-07", cashea_receivable_usd: 60 },
        { ...close, id: "collected", date: "2026-08-06", cashea_receivable_usd: 70 },
        { ...close, id: "voided", date: "2026-08-05", cashea_voided_return_usd: 20 },
      ],
      unclosedDays: [],
      casheaStatuses: [
        { sale_date: "2026-08-08", orders_count: 3, collected_count: 1 },
        { sale_date: "2026-08-07", orders_count: 1, collected_count: 0 },
        { sale_date: "2026-08-06", orders_count: 2, collected_count: 2 },
      ],
    });

    render(
      <TooltipProvider>
        <DataTable columns={columns} data={data} hidePagination />
      </TooltipProvider>,
    );

    expect(screen.queryByRole("columnheader", { name: /crédito/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Cobro Cashea" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
    expect(screen.getByRole("columnheader", { name: "Total producido USD" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total producido Bs." })).toBeInTheDocument();

    const [mixed, pending, collected, voided] = screen.getAllByRole("row").slice(1);
    expect(within(mixed).queryByRole("cell", { name: `−${formatCurrencyUSD(57)}` })).not.toBeInTheDocument();
    expect(within(mixed).getByRole("cell", { name: "Cobrado parcialmente" })).toBeInTheDocument();
    expect(within(mixed).getByText("Cobrado parcialmente")).toHaveAttribute("data-slot", "badge");
    expect(within(mixed).queryByText(/de 3 cobradas/)).not.toBeInTheDocument();
    expect(within(pending).getByRole("cell", { name: "Pendiente" })).toBeInTheDocument();
    expect(within(collected).getByRole("cell", { name: "Cobrado" })).toBeInTheDocument();
    expect(within(collected).queryByText(`−${formatCurrencyUSD(70)}`)).not.toBeInTheDocument();
    expect(within(voided).getByRole("cell", { name: "—" })).toBeInTheDocument();
    expect(within(voided).queryByText(`+${formatCurrencyUSD(20)}`)).not.toBeInTheDocument();
    matchMedia.mockRestore();
  });
});
