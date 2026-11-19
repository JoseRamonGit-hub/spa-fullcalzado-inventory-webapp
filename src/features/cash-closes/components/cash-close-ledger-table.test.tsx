import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { CashCloseFigures } from "../cash-close-ledger";
import { CashCloseLedgerTable } from "./cash-close-ledger-table";

vi.unmock("@tanstack/react-router");

vi.mock("../hooks/useCashCloseQueries", () => ({
  useLedgerReturns: () => ({
    data: [
      {
        type: "exchange",
        credit_usd: 20,
        credit_ves: 1600,
        transactions: [{ quantity: 1, total_usd: 49, total_ves: 3920 }],
      },
    ],
  }),
  useLedgerCasheaOrders: () => ({
    data: [
      {
        sale_id: "sale",
        status: "pending",
        paid_today_usd: 21,
        financed_usd: 40,
        exchange_rate: 80,
        sale: { transactions: [{ quantity: 1, total_usd: 61, total_ves: 4880 }] },
      },
    ],
  }),
}));

const figures: CashCloseFigures = {
  billedOperations: 4,
  units: 4,
  returnsCount: 1,
  billed: { usd: 189, ves: 15120 },
  returnsCredit: { usd: 20, ves: 1600 },
  casheaReceivable: { usd: 40, ves: 3200 },
  casheaVoidedReturn: { usd: 0, ves: 0 },
  produced: { usd: 129, ves: 10320 },
};

it("enlaza el conteo a Ventas del día y mantiene el desglose independiente de Cashea", async () => {
  const root = createRootRoute();
  const ledger = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => (
      <TooltipProvider>
        <CashCloseLedgerTable figures={figures} date="2026-11-19" title="Hoy" density="operational" />
      </TooltipProvider>
    ),
  });
  const transactions = createRoute({
    getParentRoute: () => root,
    path: "/transactions",
    component: () => <h1>Ventas del día</h1>,
  });
  const router = createRouter({
    routeTree: root.addChildren([ledger, transactions]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  const sales = await screen.findByRole("row", { name: /^Ventas/ });

  expect(screen.queryByText("Total facturado")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Ver detalle por operación" })).not.toBeInTheDocument();
  const produced = screen.getByRole("row", { name: /^Total producido/ });
  expect(screen.getAllByRole("row").at(-1)).toBe(produced);
  expect(produced).toHaveTextContent(formatCurrencyUSD(129));

  const cashea = screen.getByRole("button", { name: /^Cashea/ });
  const cambios = screen.getByRole("button", { name: /^Cambios/ });
  const row = screen.getByRole("row", { name: /^Cashea/ });
  const [, count, usd, ves] = within(row).getAllByRole("cell");
  expect(count).toHaveTextContent("1 orden");
  expect(usd).toHaveTextContent(`+${formatCurrencyUSD(21)}`);
  expect(ves).toHaveTextContent(`+${formatCurrencyVES(1680)}`);
  expect(cashea).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("Monto financiado · fuera del total")).not.toBeInTheDocument();

  fireEvent.click(usd);
  expect(cashea).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("row", { name: /^Iniciales cobradas/ })).toHaveTextContent(`+${formatCurrencyUSD(21)}`);
  const [, , receivable] = within(
    screen.getByRole("row", { name: /^Monto financiado · fuera del total/ }),
  ).getAllByRole("cell");
  expect(receivable.textContent).toBe(formatCurrencyUSD(40));
  expect(cambios).toHaveAttribute("aria-expanded", "false");

  fireEvent.click(cambios);
  fireEvent.click(cashea);
  expect(screen.queryByText("Iniciales cobradas")).not.toBeInTheDocument();
  expect(screen.getByText("Entregado al cliente")).toBeInTheDocument();
  expect(row).toHaveTextContent(`+${formatCurrencyUSD(21)}`);

  const [, salesDetail] = within(sales).getAllByRole("cell");
  const salesLink = within(salesDetail).getByRole("link", { name: "2 ventas · 2 unidades" });
  fireEvent.click(salesLink);
  expect(await screen.findByRole("heading", { name: "Ventas del día" })).toBeInTheDocument();
  expect(router.state.location.searchStr).toBe("?date=2026-11-19");
});
