import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ProductDetailPage } from "./page";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import type { InventoryMovement, Product } from "@/types";

const navigate = vi.fn();
const refetch = vi.fn();
let detail: { product: Product; lastActivity: InventoryMovement | null } | null;
let exchangeRate: { rate: number } | null;
let queryState: "success" | "error";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
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

describe("ProductDetailPage", () => {
  beforeEach(() => {
    navigate.mockClear();
    refetch.mockClear();
    detail = { product, lastActivity: activity };
    exchangeRate = { rate: 90 };
    queryState = "success";
    useBusinessStore.setState({ activeBusinessId: "business-1" });
  });

  it("shows the current product, the active-rate price and latest audited event", () => {
    render(<ProductDetailPage />);

    expect(screen.getByRole("heading", { name: "Historial de movimientos" })).toBeInTheDocument();
    expect(screen.getByText("FC-101")).toBeInTheDocument();
    expect(screen.getByText("Deportivo clásico")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByText("2.250,00 Bs.")).toBeInTheDocument();
    expect(screen.getByText("Desactivación")).toBeInTheDocument();
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
