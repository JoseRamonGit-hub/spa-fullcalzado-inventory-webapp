import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./page";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";

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
  it("muestra el stock agrupado y omite el rótulo Pulso del negocio", () => {
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
    expect(screen.queryByText("Pulso del negocio")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Indicadores de hoy" })).toBeInTheDocument();
  });
});
