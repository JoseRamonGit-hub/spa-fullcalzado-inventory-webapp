import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductHistoryPeriodFilter } from "./product-history-period-filter";

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
});
