import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardSalesPeriod } from "../hooks/useDashboardMetrics";
import type { DashboardSalesPeriodSelection } from "../sales-period";
import { SalesPeriodSection } from "./sales-period-section";

vi.mock("../hooks/useDashboardMetrics", () => ({ useDashboardSalesPeriod: vi.fn() }));
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect, disabled }: { onSelect: (range: unknown) => void; disabled?: { after?: Date } }) => (
    <button
      type="button"
      data-testid="calendario-personalizado"
      data-future-disabled={disabled?.after instanceof Date}
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
  beforeEach(() => vi.clearAllMocks());

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
});
