import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductHistoryPeriodFilter } from "./product-history-period-filter";

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ numberOfMonths, captionLayout }: { numberOfMonths?: number; captionLayout?: string }) => (
    <div
      data-testid="calendario-personalizado"
      data-number-of-months={numberOfMonths}
      data-caption-layout={captionLayout}
    />
  ),
}));

describe("ProductHistoryPeriodFilter", () => {
  it("uses the same regular small text treatment as the inventory date filter", () => {
    render(
      <ProductHistoryPeriodFilter
        period="custom"
        customRange={undefined}
        onPeriodChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    );

    const dateTrigger = screen.getByRole("button", { name: "Seleccionar rango personalizado" });
    expect(dateTrigger).toHaveClass("text-xs", "font-normal");
  });

  it("muestra dos meses con selectores al elegir un período personalizado", () => {
    render(
      <ProductHistoryPeriodFilter
        period="custom"
        customRange={undefined}
        onPeriodChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Seleccionar rango personalizado" }));

    expect(screen.getByTestId("calendario-personalizado")).toHaveAttribute("data-number-of-months", "2");
    expect(screen.getByTestId("calendario-personalizado")).toHaveAttribute("data-caption-layout", "dropdown");
  });

  it("mantiene la limpieza del rango como un botón independiente y accesible", () => {
    const onPeriodChange = vi.fn();
    const onCustomRangeChange = vi.fn();
    render(
      <ProductHistoryPeriodFilter
        period="custom"
        customRange={{ from: new Date(2026, 6, 1), to: new Date(2026, 6, 31) }}
        onPeriodChange={onPeriodChange}
        onCustomRangeChange={onCustomRangeChange}
      />,
    );

    const dateTrigger = screen.getByRole("button", { name: "Seleccionar rango personalizado" });
    const clearButton = screen.getByRole("button", { name: "Limpiar rango y volver a los últimos 30 días" });

    expect(dateTrigger).not.toContainElement(clearButton);
    fireEvent.click(clearButton);

    expect(onCustomRangeChange).toHaveBeenCalledWith(undefined);
    expect(onPeriodChange).toHaveBeenCalledWith("last-30-days");
  });
});
