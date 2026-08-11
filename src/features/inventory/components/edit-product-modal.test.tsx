import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditProductModal } from "./edit-product-modal";
import type { Product } from "@/types";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    promise: vi.fn(),
  },
}));

vi.mock("@/features/inventory/hooks/useProductMutations", () => ({
  useUpdateProductCatalog: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children, ...props }: React.ComponentProps<"span">) => <span {...props}>{children}</span>,
}));

vi.mock("@/components/modals/shared/responsive-modal", () => ({
  ResponsiveModal: ({
    open,
    title,
    children,
    footer,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) =>
    open ? (
      <section aria-label={title}>
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
  }: {
    open: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <section aria-label={title}>
        <p>{description}</p>
        {children}
        <button type="button">{cancelLabel ?? "Volver a editar"}</button>
        <button type="button">{confirmLabel}</button>
      </section>
    ) : null,
}));

const product: Product = {
  id: "product-1",
  business_id: "business-1",
  code: "FC-101",
  description: "Deportivo clásico para caballero",
  price_usd: 25,
  stock: 8,
  active: true,
  created_at: "2026-08-01T12:00:00Z",
  updated_at: "2026-08-01T12:00:00Z",
};

describe("EditProductModal", () => {
  it("keeps the product description required and enables review only after a real change", async () => {
    render(<EditProductModal open onOpenChange={vi.fn()} product={product} />);

    const description = screen.getByLabelText("Descripción");
    const reviewButton = screen.getByRole("button", { name: "Revisar cambios" });

    expect(description).toBeRequired();
    expect(description).toHaveValue(product.description);
    expect(reviewButton).toBeDisabled();

    fireEvent.change(description, {
      target: { value: "Deportivo clásico para caballero con suela de goma" },
    });

    await waitFor(() => expect(reviewButton).toBeEnabled());
  });

  it("states what will change before saving", async () => {
    render(<EditProductModal open onOpenChange={vi.fn()} product={product} />);

    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Deportivo clásico para caballero con suela de goma" },
    });

    const reviewButton = screen.getByRole("button", { name: "Revisar cambios" });
    await waitFor(() => expect(reviewButton).toBeEnabled());
    fireEvent.click(reviewButton);

    const confirmation = await screen.findByLabelText("Confirmar cambios del producto");
    expect(confirmation).toHaveTextContent("Se actualizará 1 campo de FC-101. Revisa el valor antes de guardar.");
    expect(screen.getByRole("button", { name: "Volver a editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });
});
