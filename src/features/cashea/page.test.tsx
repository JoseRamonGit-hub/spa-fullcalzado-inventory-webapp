import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { Route as CasheaRoute } from "@/routes/_app/receivables/cashea";
import type { CasheaOrder } from "@/types";
import { resolveCasheaOrdersFilter } from "./cashea-receivables";
import { casheaKeys } from "./hooks/useCasheaQueries";
import { CasheaPage } from "./page";

vi.unmock("@tanstack/react-router");

const order: CasheaOrder = {
  id: "10000000-0000-4000-8000-000000000001",
  order_number: "6400685",
  status: "pending",
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
  collected_at: null,
  deposit_id: null,
  void_note: null,
  void_reason: null,
  voided_at: null,
  voided_by: null,
};

const collectedOrder: CasheaOrder = {
  ...order,
  status: "collected",
  collected_at: "2026-11-20T14:00:00Z",
  deposit_id: "deposit-1",
};

let isMobile = false;

vi.mock("@/services/casheaService", () => ({
  casheaService: {
    getOrder: vi.fn(async () => order),
    getOrderCounts: vi.fn().mockResolvedValue({ pending: 1, collected: 1, voided: 0, all: 2 }),
    getReceivableSummary: vi.fn().mockResolvedValue({ orders_count: 1, financed_usd: 30, expected_net_usd: 25 }),
    getSaleTotalUsd: vi.fn().mockResolvedValue(50),
    getDeposit: vi.fn().mockResolvedValue({
      deposit_date: "2026-11-20",
      expected_net_usd: 25,
      received_ves: 2250,
      cashea_orders: [{ order_number: "6400685" }],
    }),
  },
}));

vi.mock("@/services/transactionsService", () => ({
  transactionsService: { getSaleLines: vi.fn().mockResolvedValue([]) },
}));

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
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isMobile && query === "(max-width: 767px)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  isMobile = false;
  act(() => {
    useAuthStore.getState().clearAuth();
    useBusinessStore.getState().clear();
  });
});

async function renderCashea(status: "pending" | "collected" = "pending") {
  useAuthStore.getState().setAuth({
    id: order.created_by,
    default_business_id: order.business_id,
    email: "admin@example.com",
    fullname: "Admin",
    role: "admin",
    is_active: true,
    created_at: null,
    updated_at: null,
  });
  useBusinessStore.setState({ activeBusinessId: order.business_id });

  const root = createRootRoute();
  const app = createRoute({ getParentRoute: () => root, id: "_app" });
  const cashea = createRoute({
    getParentRoute: () => app,
    path: "/receivables/cashea",
    validateSearch: CasheaRoute.options.validateSearch,
    component: CasheaPage,
  });
  const router = createRouter({
    routeTree: root.addChildren([app.addChildren([cashea])]),
    history: createMemoryHistory({ initialEntries: [`/receivables/cashea?status=${status}`] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  queryClient.setQueryData(casheaKeys.orderList(order.business_id, resolveCasheaOrdersFilter({ status })), [
    status === "collected" ? collectedOrder : order,
  ]);
  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  const row = await screen.findByRole("row", { name: `Ver detalle de la orden Cashea ${order.order_number}` });
  return { row, router };
}

describe("acciones de las órdenes Cashea", () => {
  it.each([
    { action: "Cobrar orden Cashea", dialog: /Cobrar orden Cashea/, status: "pending" },
    { action: "Ajustar orden Cashea", dialog: /Ajustar orden Cashea/, status: "pending" },
    { action: "Anular orden Cashea", dialog: /Anular orden Cashea/, status: "pending" },
    { action: "Revertir depósito de la orden Cashea", dialog: /Revertir depósito Cashea/, status: "collected" },
  ] as const)("abre solo el modal al pulsar $action", async ({ action, dialog, status }) => {
    const { row, router } = await renderCashea(status);
    expect(screen.getByRole("columnheader", { name: "Acciones" })).toBeInTheDocument();

    fireEvent.click(within(row).getByRole("button", { name: `${action} ${order.order_number}` }));

    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
    expect(router.state.location.search).toEqual({ status });
    expect(screen.getByRole("alertdialog", { name: dialog })).toBeInTheDocument();
  });

  it("abre el detalle al hacer clic en una celda de la fila", async () => {
    const { row, router } = await renderCashea();
    fireEvent.click(within(row).getByText(order.invoice_number));

    expect(await screen.findByRole("dialog", { name: /6400685/ })).toBeInTheDocument();
    expect(router.state.location.search).toEqual({ status: "pending", orderId: order.id });
  });

  it("ofrece las acciones desde el detalle en móvil", async () => {
    isMobile = true;
    const { row } = await renderCashea();
    expect(screen.queryByRole("columnheader", { name: "Acciones" })).not.toBeInTheDocument();

    fireEvent.click(within(row).getByText(order.invoice_number));
    const detail = await screen.findByRole("dialog", { name: /6400685/ });
    fireEvent.click(within(detail).getByRole("button", { name: "Cobrar orden" }));

    expect(await screen.findByRole("alertdialog", { name: /Cobrar orden Cashea/ })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
  });
});
