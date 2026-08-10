import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToggleStatusModal } from "./toggle-status-modal";
import type { Product } from "@/types";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));

vi.mock("@/features/inventory/hooks/useProductMutations", () => ({
  useToggleProductActive: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/components/modals/shared/modal-ui", () => ({
  ModalProductIdentity: ({ code, description }: { code: string; description: string }) => (
    <span>
      {code} — {description}
    </span>
  ),
}));

vi.mock("@/components/modals/shared/responsive-alert-modal", () => ({
  ResponsiveAlertModal: ({
    title,
    description,
    confirmLabel,
    children,
  }: {
    title: string;
    description: string;
    confirmLabel: string;
    children: React.ReactNode;
  }) => (
    <section aria-label={title}>
      <p>{description}</p>
      {children}
      <button type="button">{confirmLabel}</button>
    </section>
  ),
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

describe("ToggleStatusModal", () => {
  it("explains the operational consequences before deactivating a product", () => {
    render(<ToggleStatusModal open onOpenChange={vi.fn()} product={product} />);

    expect(
      screen.getByText(
        "Ya no admitirá entradas de inventario. Podrá venderse hasta agotar sus existencias y seguirá aceptando devoluciones.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desactivar producto" })).toBeInTheDocument();
  });

  it("states exactly what reactivation restores", () => {
    render(<ToggleStatusModal open onOpenChange={vi.fn()} product={{ ...product, active: false }} />);

    expect(
      screen.getByText("Volverá a admitir entradas de inventario. Sus ventas y devoluciones seguirán disponibles."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reactivar producto" })).toBeInTheDocument();
  });
});
