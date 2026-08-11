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
  ConfirmDialogTableSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  ModalConfirmDialog: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <section>Confirmación</section> : null),
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
});
