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
import { Route as CasheaRoute } from "@/routes/_app/receivables/cashea";
import { Route as ReturnsRoute } from "@/routes/_app/returns";
import { Route as TransactionsRoute } from "@/routes/_app/transactions";
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
      { type: "refund", credit_usd: 10, credit_ves: 800, transactions: [] },
    ],
  }),
}));

vi.mock("@/features/cashea/hooks/useCasheaQueries", () => ({
  useCasheaOrdersForCashClose: (date: string | undefined) => ({
    data: [
      {
        sale_id: "sale",
        sale_date: date === "2026-11-10" ? "2026-11-02" : "2026-11-19",
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
  returnsCount: 2,
  billed: { usd: 189, ves: 15120 },
  returnsCredit: { usd: 30, ves: 2400 },
  casheaReceivable: { usd: 40, ves: 3200 },
  casheaVoidedReturn: { usd: 0, ves: 0 },
  produced: { usd: 119, ves: 9520 },
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
  expect(produced).toHaveTextContent(formatCurrencyUSD(119));

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
  expect(salesLink.className).toBe(within(count).getByRole("link", { name: "1 orden" }).className);
  fireEvent.click(salesLink);
  expect(await screen.findByRole("heading", { name: "Ventas del día" })).toBeInTheDocument();
  expect(router.state.location.searchStr).toBe("?date=2026-11-19");
});

const date = "2026-11-19";
const closedAt = "2026-11-20T00:26:00+00:00";
const destinations = {
  "/transactions": TransactionsRoute,
  "/returns": ReturnsRoute,
  "/receivables/cashea": CasheaRoute,
};

it.each([
  ["Ventas · 2 ventas", "/transactions", { date }, date, figures],
  ["Ventas", "/transactions", { date }, date, figures, false],
  ["Ventas", "/transactions", { date }, date, { ...figures, billedOperations: 2, units: 2 }],
  ["1 cambio", "/returns", { date, type: "exchange", closedAt }, date, figures],
  ["1 devolución", "/returns", { date, type: "refund", closedAt }, date, figures],
  [
    "1 orden",
    "/receivables/cashea",
    { status: "all", from: date, to: date, cashClose: closedAt },
    date,
    { ...figures, casheaReceivable: { usd: 35, ves: 2800 } },
  ],
  [
    "1 orden",
    "/receivables/cashea",
    { status: "all", from: "2026-11-10", to: "2026-11-10", cashClose: closedAt },
    "2026-11-10",
    { ...figures, casheaReceivable: { usd: 0, ves: 0 }, casheaVoidedReturn: { usd: 40, ves: 3200 } },
  ],
] as const)(
  "enlaza %s a %s desde el cierre guardado",
  async (label, path, search, ledgerDate, totals, hasExactOperationCount: boolean = true) => {
    const root = createRootRoute();
    const ledger = createRoute({
      getParentRoute: () => root,
      path: "/",
      component: () => (
        <TooltipProvider>
          <CashCloseLedgerTable
            figures={totals}
            date={ledgerDate}
            closedAt={closedAt}
            title="Cuadre"
            density="compact"
            hasExactOperationCount={hasExactOperationCount}
          />
        </TooltipProvider>
      ),
    });
    const destination = createRoute({
      getParentRoute: () => root,
      path,
      validateSearch: destinations[path].options.validateSearch,
      component: () => <h1>Movimientos del cierre</h1>,
    });
    const router = createRouter({
      routeTree: root.addChildren([ledger, destination]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(<RouterProvider router={router} />);

    const link = await screen.findByRole("link", { name: label });
    const row = link.closest("tr")!;
    expect(within(row).getAllByRole("cell")[label === "Ventas" ? 0 : 1]).toContainElement(link);
    expect(within(row).queryByText(/0 ventas/)).not.toBeInTheDocument();
    expect(link.closest("button")).toBeNull();
    expect(link).toHaveClass("underline", "hover:text-primary", "hover:decoration-current");
    fireEvent.click(link);
    expect(await screen.findByRole("heading", { name: "Movimientos del cierre" })).toBeInTheDocument();
    expect(router.state.location).toMatchObject({ pathname: path, search });
    expect(router.state.matches.at(-1)?.search).toMatchObject(search);
  },
);
