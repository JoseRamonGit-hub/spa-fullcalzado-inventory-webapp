import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { Route as CashClosesRoute } from "@/routes/_app/cash-closes";
import type { CashCloseSummary, CashCloseWithRelations } from "@/types";
import { CashClosesPage } from "./page";

vi.unmock("@tanstack/react-router");
vi.mock("./components/topbar", () => ({ Topbar: () => null }));

const date = "2026-03-16";
const unclosedDate = "2026-03-15";
const cashClose = {
  id: "10000000-0000-4000-8000-000000000001",
  business_id: "business-1",
  date,
  closed_at: `${date}T17:00:00Z`,
  closed_by: "user-1",
  exchange_rate: 35,
  total_billed_operations: 1,
  total_transactions: 1,
  total_units_sold: 2,
  total_usd: 50,
  total_ves: 1750,
  total_returns: 0,
  total_returns_usd: 0,
  total_returns_ves: 0,
  cashea_receivable_usd: null,
  cashea_receivable_ves: null,
  cashea_voided_return_usd: null,
  cashea_voided_return_ves: null,
  users: { fullname: "Admin" },
} satisfies CashCloseWithRelations;

const summary = {
  billedOperations: 1,
  units: 2,
  totalUsd: 50,
  totalVes: 1750,
  returnsCount: 0,
  returnsCreditUsd: 0,
  returnsCreditVes: 0,
  netUsd: 50,
  netVes: 1750,
  casheaReceivableUsd: 0,
  casheaReceivableVes: 0,
  casheaVoidedReturnUsd: 0,
  casheaVoidedReturnVes: 0,
} satisfies CashCloseSummary;

vi.mock("@/services/cashClosesService", () => ({
  cashClosesService: {
    getAll: async () => [cashClose],
    getSummary: async () => summary,
    getUnclosedDays: async () => [{ date: unclosedDate, summary }],
  },
}));

vi.mock("@/services/casheaService", () => ({
  casheaService: { getCollectionStatus: async () => [] },
}));

beforeEach(() => {
  useBusinessStore.setState({ activeBusinessId: cashClose.business_id });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  act(() => useBusinessStore.getState().clear());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderCashCloses(url: string) {
  const root = createRootRoute();
  const app = createRoute({ getParentRoute: () => root, id: "_app" });
  const route = createRoute({
    getParentRoute: () => app,
    path: "/cash-closes",
    validateSearch: CashClosesRoute.options.validateSearch,
    component: CashClosesPage,
  });
  const history = createMemoryHistory({ initialEntries: [url] });
  const router = createRouter({ routeTree: root.addChildren([app.addChildren([route])]), history });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  return history;
}

it("sincroniza el detalle con el historial de navegación y conserva la fecha al cerrarlo", async () => {
  const listUrl = `/cash-closes?date=${date}`;
  const history = renderCashCloses(listUrl);
  const row = await screen.findByRole("row", { name: /^Ver el cierre del/ });
  fireEvent.click(within(row).getByRole("cell", { name: "Admin" }));

  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(history.location.href).toBe(`${listUrl}&cashCloseId=${cashClose.id}`);

  act(() => history.back());
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(history.location.href).toBe(listUrl);

  act(() => history.forward());
  const detail = await screen.findByRole("dialog");
  fireEvent.click(within(detail).getByRole("button", { name: "Cerrar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(history.location.href).toBe(listUrl);
});

it.each([
  { id: cashClose.id, text: "Actividad del cierre" },
  { id: `unclosed-${unclosedDate}`, text: "Caja del día" },
])("abre el detalle al entrar directamente desde el enlace $id", async ({ id, text }) => {
  renderCashCloses(`/cash-closes?cashCloseId=${id}`);
  const sheet = await screen.findByRole("dialog");
  expect(await within(sheet).findByText(text)).toBeInTheDocument();
});
