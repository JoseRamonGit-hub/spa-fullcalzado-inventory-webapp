import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InventoryPage } from "./page";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { InventoryProduct, User } from "@/types";

const navigate = vi.fn();
let isMobile = false;
let inventoryStatus: "low_stock" | "stagnant" | undefined;
let inventoryDate: string | undefined;
let productsQueryError = false;
let productsQueryHasStaleData = false;
let productsQueryLoading = false;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/routes/_app/inventory", () => ({
  Route: { useSearch: () => ({ date: inventoryDate, status: inventoryStatus }) },
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobile,
}));

vi.mock("./hooks/useProductQueries", () => ({
  useProducts: () => ({
    data: productsQueryLoading || (productsQueryError && !productsQueryHasStaleData) ? undefined : [product],
    isLoading: productsQueryLoading,
    isError: productsQueryError,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/exchange-rates/hooks/useExchangeRateQueries", () => ({
  useExchangeRate: () => ({ data: { rate: 90 }, isLoading: false }),
}));

vi.mock("@/features/business/components/business-module-title", () => ({
  BusinessModuleTitle: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("./components/edit-product-modal", () => ({
  EditProductModal: ({ product }: { product: InventoryProduct }) => <div>Editando {product.code}</div>,
}));

vi.mock("./components/adjust-product-stock-modal", () => ({
  AdjustProductStockModal: ({ product }: { product: InventoryProduct }) => (
    <div>Ajustando existencias de {product.code}</div>
  ),
}));

const product: InventoryProduct = {
  id: "product-1",
  business_id: "business-1",
  code: "FC-101",
  description: "Deportivo clásico",
  price_usd: 25,
  stock: 8,
  active: true,
  created_at: "2026-08-01T12:00:00Z",
  updated_at: "2026-08-01T12:00:00Z",
  stagnantSince: "2026-07-02",
  stagnantDays: 40,
};

function setRole(role: User["role"]) {
  useAuthStore.setState({
    user: {
      id: "user-1",
      default_business_id: "business-1",
      email: "persona@example.com",
      fullname: "Persona",
      is_active: true,
      role,
      created_at: null,
      updated_at: null,
    },
  });
}

describe("InventoryPage product navigation", () => {
  beforeEach(() => {
    navigate.mockClear();
    isMobile = false;
    inventoryStatus = undefined;
    inventoryDate = undefined;
    productsQueryError = false;
    productsQueryHasStaleData = false;
    productsQueryLoading = false;
    setRole("admin");
  });

  it("shows stagnant days only while the stagnant inventory filter is active", () => {
    const { rerender } = render(<InventoryPage />);

    expect(screen.queryByRole("columnheader", { name: /Sin salida/i })).not.toBeInTheDocument();
    expect(screen.queryByText("40 días")).not.toBeInTheDocument();

    inventoryStatus = "stagnant";
    rerender(<InventoryPage />);

    expect(screen.getByRole("columnheader", { name: /Sin salida/i })).toBeInTheDocument();
    expect(screen.getByText("40 días")).toBeInTheDocument();
  });

  it("explica el alcance y el orden de revisión de los productos estancados", () => {
    inventoryStatus = "stagnant";
    render(<InventoryPage />);

    const context = screen.getByRole("region", { name: "Contexto del filtro Estancado" });

    expect(context).toHaveClass("border-warning/25", "bg-warning/8", "flex-row", "py-1.5", "md:py-2");
    expect(within(context).getByText("1 producto por revisar")).toHaveClass("text-sm", "font-semibold");
    expect(context).toHaveTextContent("Orden de revisión: mayor tiempo sin salida primero");
    expect(within(context).getByRole("status")).toHaveTextContent(
      "1 producto por revisar. Orden de revisión: mayor tiempo sin salida primero.",
    );
    expect(within(context).getByText("mayor tiempo sin salida primero").parentElement).toHaveClass("text-[11px]");
    expect(within(context).queryByText(/Incluye inactivos para liquidación o limpieza/)).not.toBeInTheDocument();
    expect(within(context).queryByText("Sin filtro por fecha de creación")).not.toBeInTheDocument();

    fireEvent.click(within(context).getByRole("button", { name: "Ver criterio del filtro Estancado" }));

    expect(
      screen
        .getByText(/Incluye productos inactivos para liquidación o limpieza/)
        .closest("[data-slot=popover-content]"),
    ).toHaveClass("w-[min(18rem,calc(100vw-1.5rem))]");
  });

  it("permite reorganizar las acciones en pantallas estrechas sin alterar la tabla", () => {
    inventoryStatus = "stagnant";
    render(<InventoryPage />);

    const context = screen.getByRole("region", { name: "Contexto del filtro Estancado" });
    const clearFilter = within(context).getByRole("button", { name: "Quitar filtro de stock" });

    expect(clearFilter.parentElement).toHaveClass("w-auto", "flex-wrap");
    expect(screen.getByRole("columnheader", { name: /Sin salida/i })).toBeInTheDocument();
  });

  it("explica el orden personalizado y permite restablecer el recomendado", () => {
    inventoryStatus = "stagnant";
    render(<InventoryPage />);

    const stagnantDaysHeader = screen.getByRole("columnheader", { name: /Sin salida/i });
    expect(screen.queryByRole("button", { name: "Restablecer orden recomendado" })).not.toBeInTheDocument();
    fireEvent.click(within(stagnantDaysHeader).getByRole("button"));
    expect(stagnantDaysHeader).not.toHaveAttribute("aria-sort", "none");
    expect(screen.getByText("personalizado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restablecer orden recomendado" }).parentElement).toHaveClass(
      "w-full",
      "md:w-auto",
    );
    expect(
      within(screen.getByRole("region", { name: "Contexto del filtro Estancado" })).getByRole("status"),
    ).toHaveTextContent("Orden de revisión: personalizado.");
    const resetPriority = screen.getByRole("button", { name: "Restablecer orden recomendado" });

    fireEvent.click(resetPriority);
    expect(stagnantDaysHeader).toHaveAttribute("aria-sort", "none");
    expect(screen.queryByRole("button", { name: "Restablecer orden recomendado" })).not.toBeInTheDocument();
    expect(screen.getByText("mayor tiempo sin salida primero")).toBeInTheDocument();
    const clearFilter = screen.getByRole("button", { name: "Quitar filtro de stock" });
    expect(clearFilter).toHaveFocus();

    fireEvent.click(clearFilter);
    expect(navigate).toHaveBeenCalledWith({ search: expect.any(Function) });
    expect(screen.getByRole("combobox", { name: "Estado de inventario" })).toHaveFocus();
  });

  it("distingue las coincidencias de búsqueda del total por revisar", () => {
    inventoryStatus = "low_stock";
    render(<InventoryPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar productos por código o descripción" }), {
      target: { value: "sin coincidencias" },
    });

    expect(screen.getByText("0 coincidencias de 1 producto por revisar")).toBeInTheDocument();
  });

  it("tolera espacios y diferencias de acentuación en la búsqueda", () => {
    inventoryStatus = "low_stock";
    render(<InventoryPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar productos por código o descripción" }), {
      target: { value: "  clasico  " },
    });

    expect(screen.getByText("Deportivo clásico")).toBeInTheDocument();
    expect(screen.getByText("1 producto por revisar")).toBeInTheDocument();
  });

  it("no presenta un total falso cuando falla la consulta de una alerta", () => {
    inventoryStatus = "low_stock";
    productsQueryError = true;
    render(<InventoryPage />);

    expect(screen.getByText("No se pudo calcular el total por revisar")).toBeInTheDocument();
    expect(screen.queryByText("0 productos")).not.toBeInTheDocument();
    expect(screen.getByText("No pudimos cargar el inventario")).toBeInTheDocument();
  });

  it("conserva los datos disponibles si falla una actualización en segundo plano", () => {
    inventoryStatus = "low_stock";
    productsQueryError = true;
    productsQueryHasStaleData = true;
    render(<InventoryPage />);

    expect(screen.getByText("1 producto por revisar")).toBeInTheDocument();
    expect(screen.getByText("Deportivo clásico")).toBeInTheDocument();
    expect(screen.queryByText("No se pudo calcular el total por revisar")).not.toBeInTheDocument();
    expect(screen.queryByText("No pudimos cargar el inventario")).not.toBeInTheDocument();
  });

  it("marca el contexto como ocupado y evita un total falso durante la carga", () => {
    inventoryStatus = "low_stock";
    productsQueryLoading = true;
    render(<InventoryPage />);

    const context = screen.getByRole("region", { name: "Contexto del filtro Stock bajo" });

    expect(context).toHaveAttribute("aria-busy", "true");
    expect(within(context).getByText("Calculando productos por revisar…")).toBeInTheDocument();
    expect(within(context).queryByText(/0 productos por revisar/)).not.toBeInTheDocument();
  });

  it("elimina una fecha previa al activar una alerta", () => {
    inventoryDate = "2026-08-01";
    render(<InventoryPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Estado de inventario" }), {
      target: { value: "low_stock" },
    });

    const navigation = navigate.mock.calls.at(-1)?.[0] as {
      search: (previous: { date?: string; status?: "low_stock" | "stagnant" }) => {
        date?: string;
        status?: "low_stock" | "stagnant";
      };
    };

    expect(navigation.search({ date: inventoryDate })).toEqual({ date: undefined, status: "low_stock" });
  });

  it("opens product detail from a desktop row and supports the keyboard", () => {
    render(<InventoryPage />);

    const row = screen.getByText("FC-101").closest("tr");
    expect(row).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(row!, { key: "Enter" });

    expect(navigate).toHaveBeenCalledWith({ to: "/inventory/$productId", params: { productId: "product-1" } });
  });

  it("keeps desktop administrative actions independent from row navigation", () => {
    render(<InventoryPage />);

    fireEvent.click(screen.getByRole("button", { name: "Editar datos del producto FC-101" }));

    expect(screen.getByText("Editando FC-101")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Ajustar existencias de FC-101" }));
    expect(screen.getByText("Ajustando existencias de FC-101")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("keeps the mobile drawer for employees and only offers product detail", () => {
    isMobile = true;
    setRole("employee");
    render(<InventoryPage />);

    fireEvent.click(screen.getByText("FC-101").closest("tr")!);

    expect(screen.getByRole("button", { name: "Ver detalle del producto" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar Producto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ajustar existencias/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Desactivar Producto/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalle del producto" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/inventory/$productId", params: { productId: "product-1" } });
  });

  it("keeps permitted management actions in the mobile admin drawer", () => {
    isMobile = true;
    render(<InventoryPage />);

    fireEvent.click(screen.getByText("FC-101").closest("tr")!);

    expect(screen.getByRole("button", { name: "Ver detalle del producto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar datos del producto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajustar existencias" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desactivar producto" })).toBeInTheDocument();
  });
});
