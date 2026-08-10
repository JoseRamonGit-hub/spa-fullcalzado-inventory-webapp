import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetricsSummary } from "./metrics-summary";

vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("MetricsSummary", () => {
  it("presenta el conteo como Operaciones facturadas", () => {
    render(
      <MetricsSummary
        metrics={{
          billedOperations: 2,
          units: 5,
          totalUsd: 100,
          totalVes: 9000,
          returnsCount: 1,
          returnsCreditUsd: 20,
          returnsCreditVes: 1800,
          netUsd: 80,
          netVes: 7200,
        }}
        label="Resumen del Día"
        isFiltered={false}
        onOpenConfirm={vi.fn()}
        isPending={false}
        hasUser
      />,
    );

    expect(screen.getByText("Operaciones facturadas")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("Ventas")).not.toBeInTheDocument();
  });
});
