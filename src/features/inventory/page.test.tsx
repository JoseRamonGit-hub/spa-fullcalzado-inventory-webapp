import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InventoryPage } from "./page";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { Product, User } from "@/types";

const navigate = vi.fn();
let isMobile = false;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/routes/_app/inventory", () => ({
  Route: { useSearch: () => ({ date: undefined }) },
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
    setRole("admin");
  });

  it("opens product detail from a desktop row and supports the keyboard", () => {
    render(<InventoryPage />);

    const row = screen.getByText("FC-101").closest("tr");
    expect(row).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(row!, { key: "Enter" });

    expect(navigate).toHaveBeenCalledWith({ to: "/inventory/$productId", params: { productId: "product-1" } });
  });

  it("keeps the mobile drawer for employees and only offers product detail", () => {
    isMobile = true;
    setRole("employee");
    render(<InventoryPage />);

    fireEvent.click(screen.getByText("FC-101").closest("tr")!);

    expect(screen.getByRole("button", { name: "Ver detalles" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar Producto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Desactivar Producto/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalles" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/inventory/$productId", params: { productId: "product-1" } });
  });
});
