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
    expect(screen.getByRole("button", { name: /Filtrar por día/ })).toHaveClass(
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

  it("permite que ambos filtros se ajusten a la misma fila en pantallas estrechas", () => {
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

    const dateFilter = screen.getByRole("button", { name: /Filtrar por día/ });
    const filterGroup = dateFilter.parentElement?.parentElement;

    expect(filterGroup).toHaveClass("grid-cols-2");
    expect(screen.getByRole("combobox", { name: "Estado de inventario" }).parentElement).toHaveClass("min-w-0", "w-full");
    expect(dateFilter.parentElement).toHaveClass("min-w-0", "w-full", "md:w-auto");
    expect(dateFilter).toHaveClass("w-full", "md:w-auto");
  });
});
