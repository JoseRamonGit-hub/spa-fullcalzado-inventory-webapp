import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InventoryPage } from "./page";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { InventoryProduct, User } from "@/types";

const navigate = vi.fn();
let isMobile = false;
let inventoryStatus: "low_stock" | "stagnant" | undefined;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/routes/_app/inventory", () => ({
  Route: { useSearch: () => ({ date: undefined, status: inventoryStatus }) },
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobile,
}));

vi.mock("./hooks/useProductQueries", () => ({
  useProducts: () => ({ data: [product], isLoading: false, isError: false }),
}));

vi.mock("@/features/exchange-rates/hooks/useExchangeRateQueries", () => ({
  useExchangeRate: () => ({ data: { rate: 90 }, isLoading: false }),
}));

vi.mock("@/features/business/components/business-module-title", () => ({
  BusinessModuleTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("./components/edit-product-modal", () => ({
  EditProductModal: ({ product }: { product: InventoryProduct }) => <div>Editando {product.code}</div>,
}));

vi.mock("./components/adjust-product-stock-modal", () => ({
  AdjustProductStockModal: ({ product }: { product: InventoryProduct }) => (
    <div>Ajustando existencias de {product.code}</div>
  ),
}));

const product: InventoryProduct = {
  id: "product-1",
  business_id: "business-1",
  code: "FC-101",
  description: "Deportivo clásico",
  price_usd: 25,
  stock: 8,
  active: true,
  created_at: "2026-08-01T12:00:00Z",
  updated_at: "2026-08-01T12:00:00Z",
  stagnantSince: "2026-07-02",
  stagnantDays: 40,
};

function setRole(role: User["role"]) {
  useAuthStore.setState({
    user: {
      id: "user-1",
      default_business_id: "business-1",
      email: "persona@example.com",
      fullname: "Persona",
      is_active: true,
      role,
      created_at: null,
      updated_at: null,
    },
  });
}

describe("InventoryPage product navigation", () => {
  beforeEach(() => {
    navigate.mockClear();
    isMobile = false;
    inventoryStatus = undefined;
    setRole("admin");
  });

  it("shows stagnant days only while the stagnant inventory filter is active", () => {
    const { rerender } = render(<InventoryPage />);

    expect(screen.queryByRole("columnheader", { name: /Sin salida/i })).not.toBeInTheDocument();
    expect(screen.queryByText("40 días")).not.toBeInTheDocument();

    inventoryStatus = "stagnant";
    rerender(<InventoryPage />);

    expect(screen.getByRole("columnheader", { name: /Sin salida/i })).toBeInTheDocument();
    expect(screen.getByText("40 días")).toBeInTheDocument();
  });

  it("opens product detail from a desktop row and supports the keyboard", () => {
    render(<InventoryPage />);

    const row = screen.getByText("FC-101").closest("tr");
    expect(row).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(row!, { key: "Enter" });

    expect(navigate).toHaveBeenCalledWith({ to: "/inventory/$productId", params: { productId: "product-1" } });
  });

  it("keeps desktop administrative actions independent from row navigation", () => {
    render(<InventoryPage />);

    fireEvent.click(screen.getByRole("button", { name: "Editar datos del producto FC-101" }));

    expect(screen.getByText("Editando FC-101")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Ajustar existencias de FC-101" }));
    expect(screen.getByText("Ajustando existencias de FC-101")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("keeps the mobile drawer for employees and only offers product detail", () => {
    isMobile = true;
    setRole("employee");
    render(<InventoryPage />);

    fireEvent.click(screen.getByText("FC-101").closest("tr")!);

    expect(screen.getByRole("button", { name: "Ver detalle del producto" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar Producto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ajustar existencias/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Desactivar Producto/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalle del producto" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/inventory/$productId", params: { productId: "product-1" } });
  });

  it("keeps permitted management actions in the mobile admin drawer", () => {
    isMobile = true;
    render(<InventoryPage />);

    fireEvent.click(screen.getByText("FC-101").closest("tr")!);

    expect(screen.getByRole("button", { name: "Ver detalle del producto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar datos del producto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajustar existencias" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desactivar producto" })).toBeInTheDocument();
  });
});
