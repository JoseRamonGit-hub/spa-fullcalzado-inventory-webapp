import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ProductDetailPage } from "./page";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { InventoryMovement, Product, ProductHistoryEvent } from "@/types";

const navigate = vi.fn();
const goBack = vi.fn();
const canGoBack = vi.fn();
const refetch = vi.fn();
const refetchHistory = vi.fn();
const useProductHistoryMock = vi.fn();
let detail: { product: Product; lastActivity: InventoryMovement | null } | null;
let exchangeRate: { rate: number } | null;
let queryState: "success" | "error";
let historyState: "success" | "pending" | "error";
let history: ProductHistoryEvent[];

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ history: { back: goBack, canGoBack } }),
}));

vi.mock("@/routes/_app/inventory_.$productId", () => ({
  Route: { useParams: () => ({ productId: "product-1" }) },
}));

vi.mock("@/features/business/components/business-module-title", () => ({
  BusinessModuleTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/features/inventory/hooks/useProductQueries", () => ({
  useProductDetail: () => ({
    data: detail,
    isPending: false,
    isError: queryState === "error",
    refetch,
  }),
}));

vi.mock("@/features/exchange-rates/hooks/useExchangeRateQueries", () => ({
  useExchangeRate: () => ({ data: exchangeRate, isPending: false, isError: false, refetch: vi.fn() }),
}));

vi.mock("@/features/product-detail/hooks/useProductHistory", () => ({
  useProductHistory: (...args: unknown[]) => {
    useProductHistoryMock(...args);
    return {
      data: history,
      isPending: historyState === "pending",
      isError: historyState === "error",
      refetch: refetchHistory,
    };
  },
}));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));

const product: Product = {
  id: "product-1",
  business_id: "business-1",
  code: "FC-101",
  description: "Deportivo clásico",
  price_usd: 25,
  stock: 8,
  active: true,
  created_at: "2026-08-01T12:00:00Z",
  updated_at: "2026-08-01T12:00:00Z",
};

const activity = {
  id: "movement-1",
  business_id: "business-1",
  product_id: "product-1",
  user_id: "user-1",
  type: "deactivation",
  quantity: 0,
  created_at: "2026-08-08T14:30:00Z",
} as InventoryMovement;

const historyEvent = {
  ...activity,
  type: "return",
  quantity: 2,
  stock_before: 6,
  return_id: "return-1",
  user_fullname: "María Pérez",
} as ProductHistoryEvent;

describe("ProductDetailPage", () => {
  beforeEach(() => {
    navigate.mockClear();
    goBack.mockClear();
    canGoBack.mockReset();
    canGoBack.mockReturnValue(true);
    refetch.mockClear();
    detail = { product, lastActivity: activity };
    exchangeRate = { rate: 90 };
    queryState = "success";
    historyState = "success";
    history = [historyEvent];
    refetchHistory.mockClear();
    useProductHistoryMock.mockClear();
    useBusinessStore.setState({ activeBusinessId: "business-1" });
  });

  it("shows the current product, the active-rate price and latest audited event", () => {
    render(<ProductDetailPage />);

    expect(screen.getByRole("heading", { name: "Historial de producto" })).toBeInTheDocument();
    expect(screen.getByText("FC-101")).toBeInTheDocument();
    expect(screen.getByText("Deportivo clásico")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByText("2.250,00 Bs.")).toBeInTheDocument();
    expect(screen.getByText("Desactivación")).toBeInTheDocument();
  });

  it("regresa a la pantalla anterior desde la que se abrió el detalle", () => {
    render(<ProductDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "Volver a la pantalla anterior" }));

    expect(goBack).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalledWith({ to: "/inventory" });
  });

  it("usa Inventario como respaldo cuando no existe una pantalla anterior", () => {
    canGoBack.mockReturnValue(false);
    render(<ProductDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "Volver a la pantalla anterior" }));

    expect(goBack).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({ to: "/inventory" });
  });

  it("keeps the complete paginated movement table available on mobile", () => {
    history = [
      historyEvent,
      {
        ...historyEvent,
        id: "movement-2",
        type: "edit",
        quantity: 0,
        return_id: null,
        description_before: "Descripción anterior",
        price_usd_before: 20,
        price_usd: 25,
      },
    ];
    render(<ProductDetailPage />);

    expect(
      screen.getByRole("region", { name: "Tabla de historial con desplazamiento horizontal" }),
    ).toBeInTheDocument();
    for (const heading of ["Tipo", "Fecha", "Hora", "Detalle", "Cant.", "Stock", "Usuario"]) {
      expect(screen.getByRole("columnheader", { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByTitle("Entrada por devolución")).toBeInTheDocument();
    expect(screen.getAllByText("María Pérez")).toHaveLength(2);
    expect(screen.getByText("Descripción editada")).toBeInTheDocument();
    expect(screen.getByText("Precio: $20.00 → $25.00")).toBeInTheDocument();
  });

  it("paginates the history in the client without changing the product summary", () => {
    history = Array.from({ length: 21 }, (_, index) => ({
      ...historyEvent,
      id: `movement-${index + 1}`,
      user_fullname: `Usuario ${index + 1}`,
    }));
    render(<ProductDetailPage />);

    expect(screen.getByText("FC-101")).toBeInTheDocument();
    expect(screen.queryByText("Usuario 21")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(screen.getByText("FC-101")).toBeInTheDocument();
    expect(screen.getByText("Usuario 21")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Período del historial" }), { target: { value: "all" } });

    expect(screen.getByText("FC-101")).toBeInTheDocument();
    expect(screen.queryByText("Usuario 21")).not.toBeInTheDocument();
  });

  it("offers the four accessible history periods and requests the selected all-history range", () => {
    render(<ProductDetailPage />);

    const period = screen.getByRole("combobox", { name: "Período del historial" });
    expect(
      within(period)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["30 días", "90 días", "Todo", "Personalizado"]);

    fireEvent.change(period, { target: { value: "all" } });

    expect(useProductHistoryMock).toHaveBeenLastCalledWith("product-1", {
      startDate: undefined,
      endDate: undefined,
      showAll: true,
    });
  });

  it("shows the legitimate empty history state", () => {
    history = [];
    render(<ProductDetailPage />);

    expect(screen.getByText("Sin movimientos.")).toBeInTheDocument();
  });

  it("offers a retry when product history fails", () => {
    historyState = "error";
    render(<ProductDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar historial" }));
    expect(refetchHistory).toHaveBeenCalledOnce();
  });

  it("uses explicit empty values when the rate and activity do not exist", () => {
    detail = { product, lastActivity: null };
    exchangeRate = null;
    render(<ProductDetailPage />);

    expect(screen.getByText("Sin tasa")).toBeInTheDocument();
    expect(screen.getByText("Sin actividad registrada")).toBeInTheDocument();
  });

  it("offers retry when the product query fails", () => {
    queryState = "error";
    render(<ProductDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("leaves the product when the active business changes", () => {
    render(<ProductDetailPage />);

    act(() => useBusinessStore.setState({ activeBusinessId: "business-2" }));

    expect(navigate).toHaveBeenCalledWith({ to: "/", replace: true });
  });

  it("redirects without rendering data when the scoped product does not exist", () => {
    detail = null;
    render(<ProductDetailPage />);

    expect(screen.queryByText("FC-101")).not.toBeInTheDocument();
    expect(navigate).toHaveBeenCalledWith({ to: "/", replace: true });
  });
});
