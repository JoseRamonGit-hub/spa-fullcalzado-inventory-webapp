import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./page";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

vi.mock("./hooks/useDashboardMetrics", () => ({
  useDashboardMetrics: vi.fn(),
}));

vi.mock("@/features/business/components/business-module-title", () => ({
  BusinessModuleTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("./components/sales-period-section", () => ({
  SalesPeriodSection: () => <div>Ventas por período</div>,
}));

vi.mock("./components/product-stock-alerts-section", () => ({
  ProductStockAlertsSection: () => <div>Alertas de inventario</div>,
}));

describe("DashboardPage", () => {
  it("prioriza las alertas y mantiene juntos los totales producido y facturado", () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      data: {
        total_produced_usd: 100,
        total_billed_usd: 100,
        returns_credit_usd: 0,
        billed_operations: 2,
        units_sold: 3,
        stock_units: 1350,
        products_in_stock: 24,
        low_stock_products: 2,
      },
      isPending: false,
      isError: false,
    } as never);

    render(<DashboardPage />);

    expect(screen.getByText("1.350 unidades")).toBeInTheDocument();
    expect(screen.getByText("Total facturado $100.00 · Sin devoluciones")).toBeInTheDocument();
    expect(screen.queryByText("Pulso del negocio")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Indicadores de hoy" })).toBeInTheDocument();
    expect(
      screen.getByText("Alertas de inventario").compareDocumentPosition(screen.getByText("Ventas por período")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(screen.getByRole("button", { name: "Revisar stock bajo" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/inventory", search: { status: "low_stock" } });
  });

  it("explica la diferencia entre ambos totales cuando hubo devoluciones", () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      data: {
        total_produced_usd: 100,
        total_billed_usd: 120,
        returns_credit_usd: 20,
        billed_operations: 2,
        units_sold: 3,
        stock_units: 1350,
        products_in_stock: 24,
        low_stock_products: 0,
      },
      isPending: false,
      isError: false,
    } as never);

    render(<DashboardPage />);

    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("Total facturado $120.00 · −$20.00 en devoluciones")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /revisar .* productos/i })).not.toBeInTheDocument();
  });
});
