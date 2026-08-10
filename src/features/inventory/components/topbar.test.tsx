import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Topbar } from "./topbar";

vi.mock("@/features/business/components/business-module-title", () => ({
  BusinessModuleTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

describe("Topbar de Inventario", () => {
  it("comparte la tipografía y el color inactivo entre sus filtros", () => {
    render(
      <Topbar
        search=""
        onSearchChange={vi.fn()}
        date={undefined}
        onDateChange={vi.fn()}
        stockStatus={undefined}
        onStockStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Estado de inventario" })).toHaveClass(
      "text-xs",
      "font-normal",
      "text-muted-foreground",
    );
    expect(screen.getByRole("button", { name: "Filtrar por día" })).toHaveClass(
      "text-xs",
      "font-normal",
      "text-muted-foreground",
    );
  });

  it("usa el tratamiento activo cuando se elige un estado", () => {
    render(
      <Topbar
        search=""
        onSearchChange={vi.fn()}
        date={undefined}
        onDateChange={vi.fn()}
        stockStatus="low_stock"
        onStockStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Estado de inventario" })).toHaveClass(
      "border-primary/40",
      "text-foreground",
    );
  });
});
