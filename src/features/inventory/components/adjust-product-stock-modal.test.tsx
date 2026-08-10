import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdjustProductStockModal } from "./adjust-product-stock-modal";
import type { Product } from "@/types";

const { mutateAsync, toastInfo } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: toastInfo,
    promise: vi.fn(),
  },
}));

vi.mock("@/features/inventory/hooks/useProductMutations", () => ({
  useAdjustProductStock: () => ({ isPending: false, mutateAsync }),
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
  ModalProductIdentity: ({ code, description }: { code: string; description: string }) => (
    <span>
      {code} — {description}
    </span>
  ),
  ConfirmDialogSummarySection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  ModalConfirmDialog: ({
    isOpen,
    title,
    confirmLabel,
    children,
    onConfirmSubmit,
  }: {
    isOpen: boolean;
    title: string;
    confirmLabel: string;
    children: React.ReactNode;
    onConfirmSubmit: () => void;
  }) =>
    isOpen ? (
      <section aria-label={title}>
        {children}
        <button type="button" onClick={onConfirmSubmit}>
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

describe("AdjustProductStockModal", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue(undefined);
    toastInfo.mockReset();
  });

  it("confirms the current, new, delta, and provided reason before writing", async () => {
    render(<AdjustProductStockModal open onOpenChange={vi.fn()} product={product} />);

    expect(screen.getByLabelText("Motivo (opcional)").tagName).toBe("TEXTAREA");
    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Motivo (opcional)"), {
      target: { value: "Corrección por conteo físico" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Revisar ajuste" }));

    const confirmation = await screen.findByLabelText("Confirmar ajuste de existencias");
    expect(confirmation).toHaveTextContent("Actual8");
    expect(confirmation).toHaveTextContent("Nuevo10");
    expect(confirmation).toHaveTextContent("Diferencia+2");
    expect(confirmation).toHaveTextContent("Corrección por conteo físico");

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

  it("does not allow a no-op adjustment", async () => {
    render(<AdjustProductStockModal open onOpenChange={vi.fn()} product={product} />);

    fireEvent.click(screen.getByRole("button", { name: "Revisar ajuste" }));

    await waitFor(() =>
      expect(toastInfo).toHaveBeenCalledWith("Las nuevas existencias deben ser diferentes a las actuales."),
    );
    expect(screen.queryByLabelText("Confirmar ajuste de existencias")).not.toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("allows an empty reason and records the database-compatible fallback", async () => {
    render(<AdjustProductStockModal open onOpenChange={vi.fn()} product={product} />);

    expect(screen.getByLabelText("Motivo (opcional)")).not.toBeRequired();
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
    render(<AdjustProductStockModal open onOpenChange={vi.fn()} product={product} />);

    fireEvent.change(screen.getByLabelText("Nuevo total"), { target: { value: "7" } });
    const reasonInput = screen.getByLabelText("Motivo (opcional)");
    fireEvent.change(reasonInput, { target: { value: "x" } });
    fireEvent.blur(reasonInput);
    fireEvent.click(screen.getByRole("button", { name: "Revisar ajuste" }));

    expect(await screen.findByText("Indica al menos 3 caracteres")).toBeInTheDocument();
    expect(screen.queryByLabelText("Confirmar ajuste de existencias")).not.toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
