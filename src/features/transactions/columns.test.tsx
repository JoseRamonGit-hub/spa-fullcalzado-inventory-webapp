import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/ui/data-table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { CasheaPage } from "@/features/cashea/page";
import { Route as CasheaRoute } from "@/routes/_app/receivables/cashea";
import { casheaService } from "@/services/casheaService";
import type { CasheaOrder, TransactionWithRelations } from "@/types";
import { columns } from "./columns";
import { groupSaleRows } from "./sales-display";

vi.unmock("@tanstack/react-router");

vi.mock("@/services/casheaService", () => ({
  casheaService: {
    getOrder: vi.fn(),
    getOrders: vi.fn().mockResolvedValue([]),
    getOrderCounts: vi.fn().mockResolvedValue({ pending: 0, collected: 0, voided: 0, all: 0 }),
    getReceivableSummary: vi.fn().mockResolvedValue({ orders_count: 0, financed_usd: 0, expected_net_usd: 0 }),
  },
}));

vi.mock("@/services/transactionsService", () => ({
  transactionsService: { getSaleLines: vi.fn().mockResolvedValue([]) },
}));

const activeOrderId = "10000000-0000-4000-8000-000000000001";
const voidedOrderId = "10000000-0000-4000-8000-000000000002";

beforeAll(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
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

afterEach(() => {
  act(() => useBusinessStore.getState().clear());
  vi.mocked(casheaService.getOrder).mockReset();
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

async function renderRows(data: TransactionWithRelations[], pageSize = 20) {
  const sales = groupSaleRows(data);
  const root = createRootRoute();
  const app = createRoute({ getParentRoute: () => root, id: "_app" });
  const transactions = createRoute({
    getParentRoute: () => app,
    path: "/transactions",
    component: () => (
      <DataTable
        columns={columns}
        data={sales}
        getRowId={(row) => row.id}
        getSubRows={(row) => row.lines}
        pageSize={pageSize}
        scrollAreaLabel="Ventas"
      />
    ),
  });
  const cashea = createRoute({
    getParentRoute: () => app,
    path: "/receivables/cashea",
    validateSearch: CasheaRoute.options.validateSearch,
    component: CasheaPage,
  });
  const initialPath = "/transactions?date=2026-11-12";
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree: root.addChildren([app.addChildren([transactions, cashea])]), history });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
  const rows = (await screen.findAllByRole("row")).slice(1);
  return { rows, history, initialPath, router };
}

describe("columnas de Ventas", () => {
  it("pagina por venta y permite desplegar sus renglones con un solo enlace Cashea", async () => {
    const sales = { cashea_orders: [{ id: activeOrderId, order_number: "6400685", status: "pending" as const }] };
    const { rows } = await renderRows(
      [
        makeTransaction({ id: "line-1", sales }),
        makeTransaction({ id: "line-1-repeat", sales }),
        makeTransaction({ id: "legacy-1", sale_id: null, sales: null }),
        makeTransaction({
          id: "line-2",
          product_id: "product-2",
          products: { code: "FC-02", description: "P2" },
          sales,
        }),
        makeTransaction({ id: "legacy-2", sale_id: null, sales: null }),
      ],
      1,
    );

    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByRole("link", { name: "Ver orden Cashea 6400685" })).toHaveAttribute(
      "href",
      `/receivables/cashea?orderId=${activeOrderId}&onlyOrder=true`,
    );
    const total = within(rows[0]).getByText("$150.00");
    fireEvent.click(total);
    expect(screen.getByText("FC-02")).toBeInTheDocument();
    fireEvent.click(within(rows[0]).getByText("Cajero"));
    expect(within(rows[0]).getByText("3 unidades")).toBeInTheDocument();
    expect(within(rows[0]).getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("FC-01")).not.toBeInTheDocument();
    expect(screen.queryByText("FC-02")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver 3 unidades" }));
    expect(screen.getByText("FC-01")).toBeInTheDocument();
    expect(within(screen.getByText("FC-01").closest("tr")!).getByText("2")).toBeInTheDocument();
    expect(within(screen.getByText("FC-01").closest("tr")!).getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("FC-02")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ver orden Cashea 6400685" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Ocultar 3 unidades" })).toHaveAttribute("aria-expanded", "true");
    expect(within(rows[0]).queryByText("3 unidades")).not.toBeInTheDocument();
    fireEvent.click(total);
    expect(within(rows[0]).getByText("3 unidades")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver 3 unidades" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.queryByText("FC-02")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeEnabled();
  });

  it("mantiene la orden abierta desde Ventas como filtro hasta volver a la lista de órdenes", async () => {
    const order: CasheaOrder = {
      id: activeOrderId,
      order_number: "6400601",
      status: "collected",
      business_id: "business-1",
      sale_id: "sale-1",
      invoice_number: "1001",
      sale_date: "2026-11-12",
      created_at: "2026-11-12T14:00:00Z",
      created_by: "user-1",
      total_usd: 50,
      paid_today_usd: 20,
      financed_usd: 30,
      expected_net_usd: 25,
      advance_fee_pct: 4,
      service_fee_pct: 4,
      exchange_rate: 90,
      collected_at: "2026-11-20T14:00:00Z",
      deposit_id: "deposit-1",
      void_note: null,
      void_reason: null,
      voided_at: null,
      voided_by: null,
    };
    const otherOrder: CasheaOrder = {
      ...order,
      id: "10000000-0000-4000-8000-000000000003",
      order_number: "6400602",
      status: "pending",
    };
    useBusinessStore.setState({ activeBusinessId: order.business_id });
    vi.mocked(casheaService.getOrder).mockResolvedValue(order);
    vi.mocked(casheaService.getOrders).mockResolvedValueOnce([otherOrder]);
    const { rows, history, initialPath, router } = await renderRows([
      makeTransaction({
        sales: {
          cashea_orders: [{ id: voidedOrderId, order_number: "6400600", status: "voided" }, order],
        },
      }),
    ]);

    fireEvent.click(within(rows[0]).getByRole("link", { name: "Ver orden Cashea 6400601" }));

    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText("Factura 1001")).toBeInTheDocument();
    expect(sheet).toHaveAccessibleName(/6400601/);
    expect(casheaService.getOrder).toHaveBeenCalledWith(order.business_id, order.id, expect.any(AbortSignal));
    const backgroundTable = within(screen.getByRole("table", { hidden: true }));
    expect(backgroundTable.getAllByRole("row", { hidden: true })).toHaveLength(2);
    expect(backgroundTable.getByText("6400601")).toBeInTheDocument();

    fireEvent.click(within(sheet).getByRole("button", { name: "Cerrar" }));
    const focusedRow = await screen.findByRole("row", { name: "Ver detalle de la orden Cashea 6400601" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.state.location.search).toEqual({ orderId: order.id, onlyOrder: true, sheet: "closed" });
    expect(screen.queryByRole("row", { name: "Ver detalle de la orden Cashea 6400602" })).not.toBeInTheDocument();

    fireEvent.click(focusedRow);
    const reopenedSheet = await screen.findByRole("dialog", { name: /6400601/ });
    expect(router.state.location.search).toEqual({ orderId: order.id, onlyOrder: true });
    fireEvent.click(within(reopenedSheet).getByRole("button", { name: "Cerrar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Volver a la lista de órdenes" }));
    await screen.findByRole("row", { name: "Ver detalle de la orden Cashea 6400602" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(history.location.href).toBe("/receivables/cashea");

    act(() => history.back());
    await screen.findByRole("link", { name: "Ver orden Cashea 6400601" });
    expect(history.location.href).toBe(initialPath);

    vi.mocked(casheaService.getOrders).mockResolvedValueOnce([order]);
    await act(() => router.navigate({ to: "/receivables/cashea", search: { status: "collected" } }));
    fireEvent.click(await screen.findByRole("row", { name: "Ver detalle de la orden Cashea 6400601" }));
    await screen.findByRole("dialog", { name: /6400601/ });
    expect(router.state.location.search).toEqual({ status: "collected", orderId: order.id });

    act(() => history.back());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(router.state.location.search).toEqual({ status: "collected" });

    const searchField = screen.getByRole("textbox", { name: "Buscar por número de orden o de factura" });
    fireEvent.change(searchField, { target: { value: order.order_number } });
    fireEvent.click(screen.getByRole("button", { name: "Restablecer a Pendientes" }));
    await waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(searchField).toHaveValue("");
  });

  it("no marca las Ventas sin Orden Cashea vigente ni los Renglones sin Venta", async () => {
    const { rows } = await renderRows([
      makeTransaction({
        id: "line-1",
        sales: { cashea_orders: [{ id: voidedOrderId, order_number: "6400600", status: "voided" }] },
      }),
      makeTransaction({ id: "line-2", sale_id: "sale-2", sales: { cashea_orders: [] } }),
      makeTransaction({ id: "line-3", sale_id: null, sales: null }),
    ]);

    for (const row of rows) {
      expect(within(row).queryByText("Cashea")).not.toBeInTheDocument();
    }
  });
});
