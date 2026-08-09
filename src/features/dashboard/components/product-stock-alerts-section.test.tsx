import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardProductStockAlerts } from "../hooks/useDashboardMetrics";
import { ProductStockAlertsSection } from "./product-stock-alerts-section";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("../hooks/useDashboardMetrics", () => ({
  useDashboardProductStockAlerts: vi.fn(),
}));

describe("Alertas de inventario del Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardProductStockAlerts).mockImplementation(
      (type) =>
        ({
          data: [
            {
              type,
              rank: 1,
              productId: `${type}-product`,
              code: type === "low_stock" ? "LOW-01" : "OLD-01",
              description: "Producto de prueba",
              stock: type === "low_stock" ? 2 : 5,
              active: type === "low_stock",
              stagnantSince: type === "stagnant" ? "2024-01-01" : null,
              stagnantDays: type === "stagnant" ? 40 : null,
            },
          ],
          isPending: false,
          isError: false,
        }) as never,
    );
  });

  it("muestra ambas listas y abre el Producto seleccionado", () => {
    render(<ProductStockAlertsSection />);

    expect(screen.getByText("Productos con stock bajo")).toBeInTheDocument();
    expect(screen.getByText("Productos estancados")).toBeInTheDocument();
    expect(screen.getByText("40 días")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("row", { name: "Ver detalles de OLD-01" }));
    expect(navigate).toHaveBeenCalledWith({
      to: "/inventory/$productId",
      params: { productId: "stagnant-product" },
    });
  });

  it("abre Inventario con el estado equivalente validado", () => {
    render(<ProductStockAlertsSection />);

    fireEvent.click(screen.getByRole("button", { name: "Ver Stock bajo en Inventario" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/inventory", search: { status: "low_stock" } });

    fireEvent.click(screen.getByRole("button", { name: "Ver Estancado en Inventario" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/inventory", search: { status: "stagnant" } });
  });

  it("oculta Ver todos cuando una lista no tiene resultados", () => {
    vi.mocked(useDashboardProductStockAlerts).mockImplementation(
      (type) =>
        ({
          data:
            type === "low_stock"
              ? [
                  {
                    type,
                    rank: 1,
                    productId: "low-stock-product",
                    code: "LOW-01",
                    description: "Producto de prueba",
                    stock: 2,
                    active: true,
                    stagnantSince: null,
                    stagnantDays: null,
                  },
                ]
              : [],
          isPending: false,
          isError: false,
        }) as never,
    );

    render(<ProductStockAlertsSection />);

    expect(screen.getByText("No hay productos estancados.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver Estancado en Inventario" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver Stock bajo en Inventario" })).toBeInTheDocument();
  });
});
