import { useState, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardSalesPeriod, useDashboardTopProducts } from "../hooks/useDashboardMetrics";
import type { DashboardSalesPeriodSelection } from "../sales-period";
import { SalesPeriodSection } from "./sales-period-section";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("../hooks/useDashboardMetrics", () => ({
  useDashboardSalesPeriod: vi.fn(),
  useDashboardTopProducts: vi.fn(),
}));
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    onSelect,
    disabled,
    numberOfMonths,
    captionLayout,
  }: {
    onSelect: (range: unknown) => void;
    disabled?: { after?: Date };
    numberOfMonths?: number;
    captionLayout?: string;
  }) => (
    <button
      type="button"
      data-testid="calendario-personalizado"
      data-future-disabled={disabled?.after instanceof Date}
      data-number-of-months={numberOfMonths}
      data-caption-layout={captionLayout}
      onClick={() => onSelect({ from: new Date(2024, 2, 20), to: new Date(2024, 2, 27) })}
    >
      Elegir rango de prueba
    </button>
  ),
}));

const emptyCustomPeriod = {
  preset: "custom" as const,
  currentStart: "2024-03-20",
  currentEnd: "2024-03-27",
  comparisonStart: "2024-03-12",
  comparisonEnd: "2024-03-19",
  totalUsd: 0,
  previousTotalUsd: 0,
  operations: 0,
  previousOperations: 0,
  averageTicketUsd: 0,
  buckets: [
    {
      index: 0,
      label: "20/03/24–26/03/24",
      startDate: "2024-03-20",
      endDate: "2024-03-26",
      isAvailable: true,
      totalUsd: 0,
    },
  ],
};

function StatefulSalesPeriodSection() {
  const [selection, setSelection] = useState<DashboardSalesPeriodSelection>({ preset: "week" });

  return <SalesPeriodSection selection={selection} onSelectionChange={setSelection} />;
}

describe("Ventas por período", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardTopProducts).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);
  });

  it("no consulta ni conserva resultados mientras Personalizado esté incompleto", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({ isFetching: false } as never);

    render(<SalesPeriodSection selection={{ preset: "custom" }} onSelectionChange={vi.fn()} />);

    expect(useDashboardSalesPeriod).toHaveBeenCalledWith(null);
    expect(screen.getByText("Selecciona una fecha de inicio y una fecha de fin.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /seleccionar fechas/i })).toBeInTheDocument();
  });

  it("valida y aplica el rango antes de consultar", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({ isPending: true, isFetching: true } as never);
    render(<StatefulSalesPeriodSection />);

    fireEvent.click(screen.getByRole("radio", { name: "Personalizado" }));
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar fechas" }));

    const applyButton = screen.getByRole("button", { name: "Aplicar rango" });
    expect(applyButton).toBeDisabled();
    expect(screen.getByTestId("calendario-personalizado")).toHaveAttribute("data-future-disabled", "true");
    expect(screen.getByTestId("calendario-personalizado")).toHaveAttribute("data-number-of-months", "2");
    expect(screen.getByTestId("calendario-personalizado")).toHaveAttribute("data-caption-layout", "dropdown");

    fireEvent.click(screen.getByRole("button", { name: "Elegir rango de prueba" }));
    expect(applyButton).toBeEnabled();
    fireEvent.click(applyButton);

    expect(useDashboardSalesPeriod).toHaveBeenLastCalledWith({
      preset: "custom",
      startDate: "2024-03-20",
      endDate: "2024-03-27",
    });
  });

  it("muestra el rango vacío y deja cada valor accesible por teclado", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({
      data: emptyCustomPeriod,
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);

    render(
      <SalesPeriodSection
        selection={{ preset: "custom", customStartDate: "2024-03-20", customEndDate: "2024-03-27" }}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Sin actividad en este período")).toHaveLength(2);
    expect(screen.getByLabelText("20/03/24–26/03/24: $0.00")).toHaveAttribute("tabindex", "0");
  });

  it("mantiene visible la advertencia anual durante la carga", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({ isPending: true, isFetching: true } as never);

    render(
      <SalesPeriodSection
        selection={{ preset: "custom", customStartDate: "2024-02-29", customEndDate: "2025-03-01" }}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Rango extenso")).toBeInTheDocument();
    expect(screen.getByLabelText("Cargando facturación por período")).toBeInTheDocument();
  });

  it("conserva los estados breves de carga y error recuperable", () => {
    const refetch = vi.fn();
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({ isPending: true, isFetching: true } as never);
    const { rerender } = render(<SalesPeriodSection selection={{ preset: "week" }} onSelectionChange={vi.fn()} />);
    expect(screen.getByLabelText("Cargando facturación por período")).toBeInTheDocument();

    vi.mocked(useDashboardSalesPeriod).mockReturnValue({
      isPending: false,
      isError: true,
      isFetching: false,
      refetch,
    } as never);
    rerender(<SalesPeriodSection selection={{ preset: "week" }} onSelectionChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("comparte el período con el Top, cambia el ranking y abre el detalle", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({
      data: emptyCustomPeriod,
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);
    vi.mocked(useDashboardTopProducts).mockReturnValue({
      data: [
        {
          rank: 1,
          productId: "product-1",
          code: "TOP-01",
          description: "Zapato de prueba",
          units: 3,
          grossUsd: 75,
        },
      ],
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);
    const request = { preset: "custom", startDate: "2024-03-20", endDate: "2024-03-27" } as const;

    render(
      <SalesPeriodSection
        selection={{ preset: "custom", customStartDate: request.startDate, customEndDate: request.endDate }}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(useDashboardTopProducts).toHaveBeenLastCalledWith(request, "units");
    fireEvent.click(screen.getByRole("radio", { name: "USD bruto" }));
    expect(useDashboardTopProducts).toHaveBeenLastCalledWith(request, "gross_usd");

    fireEvent.click(screen.getByRole("row", { name: "Ver detalles de TOP-01" }));
    expect(navigate).toHaveBeenCalledWith({
      to: "/inventory/$productId",
      params: { productId: "product-1" },
    });
  });

  it("presenta un vacío legítimo cuando no hay Productos en el Top", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({
      data: emptyCustomPeriod,
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);

    render(
      <SalesPeriodSection
        selection={{ preset: "custom", customStartDate: "2024-03-20", customEndDate: "2024-03-27" }}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("No hay productos vendidos en este período.")).toBeInTheDocument();
  });

  it("presenta el análisis como una sección plana con contexto de período", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({
      data: {
        ...emptyCustomPeriod,
        preset: "week",
        currentStart: "2024-03-25",
        currentEnd: "2024-03-27",
        comparisonStart: "2024-03-18",
        comparisonEnd: "2024-03-20",
      },
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);

    render(<SalesPeriodSection selection={{ preset: "week" }} onSelectionChange={vi.fn()} />);

    const title = screen.getByRole("heading", { name: "Ventas por período" });
    expect(title.closest('[data-slot="card"]')).toBeNull();
    expect(screen.getByText("Facturado en el período")).toBeInTheDocument();
    expect(screen.getByText("Por operación facturada")).toBeInTheDocument();
    expect(screen.getByText("Comparado con el mismo tramo de la semana anterior")).toBeInTheDocument();
    expect(
      screen.getByText("25 mar. 2024–27 mar. 2024 · período anterior 18 mar. 2024–20 mar. 2024"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Top productos" })).toBeInTheDocument();
    expect(screen.getByText("Ventas del período seleccionado")).toBeInTheDocument();
  });

  it("espera ambas respuestas antes de revelar un período nuevo", () => {
    vi.mocked(useDashboardSalesPeriod).mockReturnValue({
      data: { ...emptyCustomPeriod, preset: "week" },
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);
    const { rerender } = render(<SalesPeriodSection selection={{ preset: "week" }} onSelectionChange={vi.fn()} />);

    vi.mocked(useDashboardSalesPeriod).mockReturnValue({
      data: { ...emptyCustomPeriod, preset: "month" },
      isPending: false,
      isError: false,
      isFetching: false,
    } as never);
    vi.mocked(useDashboardTopProducts).mockReturnValue({
      isPending: true,
      isError: false,
      isFetching: true,
    } as never);
    rerender(<SalesPeriodSection selection={{ preset: "month" }} onSelectionChange={vi.fn()} />);

    expect(screen.getByLabelText("Cargando facturación por período")).toBeInTheDocument();
    expect(screen.queryByText("Top productos")).not.toBeInTheDocument();
  });
});
