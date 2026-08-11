import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdjustProductStockModal } from "./adjust-product-stock-modal";
import type { Product } from "@/types";

const { mutateAsync } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    promise: vi.fn(),
  },
}));

vi.mock("@/features/inventory/hooks/useProductMutations", () => ({
  useAdjustProductStock: () => ({ isPending: false, mutateAsync }),
}));

vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children, ...props }: React.ComponentProps<"span">) => <span {...props}>{children}</span>,
}));

vi.mock("@/components/modals/shared/responsive-modal", () => ({
  ResponsiveModal: ({
    open,
    title,
    description,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    description: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) =>
    open ? (
      <section aria-label={title}>
        <p>{description}</p>
        {children}
        {footer}
      </section>
    ) : null,
}));

vi.mock("@/components/modals/shared/modal-ui", () => ({
  ConfirmDialogSummarySection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

vi.mock("@/components/modals/shared/confirmation-modal", () => ({
  ConfirmationProductIdentity: ({ code, description }: { code: string; description: string }) => (
    <span>
      {description} — {code}
    </span>
  ),
  ConfirmationModal: ({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    children,
    onConfirm,
  }: {
    open: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    children: React.ReactNode;
    onConfirm: () => void;
  }) =>
    open ? (
      <section aria-label={title}>
        <p>{description}</p>
        {children}
        <button type="button">{cancelLabel ?? "Volver a editar"}</button>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </section>
    ) : null,
}));

const product: Product = {
  id: "product-1",
  business_id: "business-1",
  code: "FC-101",
  description: "Deportivo clásico",
  price_usd: 25,
  stock: 8,
  active: true,
  created_at: "2026-08-01T12:00:00Z",
  updated_at: "2026-08-01T12:00:00Z",
};

function renderModal() {
  return render(<AdjustProductStockModal open onOpenChange={vi.fn()} product={product} />);
}

describe("AdjustProductStockModal", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue(undefined);
  });

  it("confirms the current, new, delta, and provided reason before writing", async () => {
    renderModal();

    expect(screen.getByLabelText("Motivo (opcional)").tagName).toBe("TEXTAREA");
    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Motivo (opcional)"), {
      target: { value: "Corrección por conteo físico" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Revisar ajuste" }));

    const confirmation = await screen.findByLabelText("Confirmar ajuste de existencias");
    expect(confirmation).toHaveTextContent("Confirma el nuevo total y el motivo antes de ajustar las existencias.");
    expect(confirmation).toHaveTextContent("Deportivo clásico");
    expect(confirmation).toHaveTextContent("FC-101");
    expect(confirmation).toHaveTextContent("Total actual8");
    expect(confirmation).toHaveTextContent("Nuevo total10");
    expect(confirmation).toHaveTextContent("Las existencias aumentarán de 8 a 10 (+2).");
    expect(confirmation).toHaveTextContent("Corrección por conteo físico");
    expect(screen.getByRole("button", { name: "Volver a editar" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aplicar ajuste" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        {
          p_product_id: "product-1",
          p_expected_stock: 8,
          p_new_stock: 10,
          p_reason: "Corrección por conteo físico",
        },
        expect.any(Object),
      ),
    );
  });

  it("disables review when the total remains unchanged", () => {
    renderModal();

    expect(screen.queryByText(/El ajuste quedará registrado en el historial/)).not.toBeInTheDocument();
    expect(screen.getByText("Cambia el total para continuar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revisar ajuste" })).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("explains the consequence of increasing or reducing the total", () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "10" } });
    expect(screen.getByRole("status")).toHaveTextContent("Las existencias aumentarán de 8 a 10 (+2).");

    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "6" } });
    expect(screen.getByRole("status")).toHaveTextContent("Las existencias se reducirán de 8 a 6 (−2).");
  });

  it("warns when the new total leaves the product without stock", async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "0" } });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Las existencias se reducirán de 8 a 0 (−8). El producto quedará sin existencias.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Revisar ajuste" }));
    const confirmation = await screen.findByLabelText("Confirmar ajuste de existencias");
    expect(confirmation).toHaveTextContent("El producto quedará sin existencias.");
  });

  it("allows an empty reason and records the database-compatible fallback", async () => {
    renderModal();

    expect(screen.getByLabelText("Motivo (opcional)")).not.toBeRequired();
    expect(
      screen.getByText("Si lo dejas vacío, se guardará como “Sin motivo indicado” en el historial."),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar ajuste" }));

    const confirmation = await screen.findByLabelText("Confirmar ajuste de existencias");
    expect(confirmation).toHaveTextContent("Sin motivo indicado");

    fireEvent.click(screen.getByRole("button", { name: "Aplicar ajuste" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        {
          p_product_id: "product-1",
          p_expected_stock: 8,
          p_new_stock: 7,
          p_reason: "Sin motivo indicado",
        },
        expect.any(Object),
      ),
    );
  });

  it("validates a reason when the administrator chooses to provide one", async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "7" } });
    const reasonInput = screen.getByLabelText("Motivo (opcional)");
    fireEvent.change(reasonInput, { target: { value: "x" } });
    fireEvent.blur(reasonInput);
    fireEvent.click(screen.getByRole("button", { name: "Revisar ajuste" }));

    expect(await screen.findByText("Escribe al menos 3 caracteres")).toBeInTheDocument();
    expect(screen.queryByLabelText("Confirmar ajuste de existencias")).not.toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
