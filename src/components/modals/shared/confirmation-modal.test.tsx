import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationModal } from "./confirmation-modal";

const viewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => viewport.isMobile }));

vi.mock("@/features/business/components/active-business-context", () => ({
  ActiveBusinessContext: () => <p>Negocio activo</p>,
}));

vi.mock("@/components/ui/overflow-tooltip", () => ({
  OverflowTooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, variant, ...props }: React.ComponentProps<"button"> & { variant?: string }) => {
    void variant;
    return <button {...props}>{children}</button>;
  },
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="alert-dialog">{children}</section>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
  AlertDialogCancel: ({ children, ...props }: React.ComponentProps<"button">) => <button {...props}>{children}</button>,
  AlertDialogAction: ({ children, variant, ...props }: React.ComponentProps<"button"> & { variant?: string }) => {
    void variant;
    return <button {...props}>{children}</button>;
  },
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <section data-testid="drawer">{children}</section>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DrawerFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
  DrawerClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Confirmar operación",
  description: "Revisa los datos.",
  confirmLabel: "Confirmar",
  pendingLabel: "Confirmando…",
  isPending: false,
  onConfirm: vi.fn(),
  children: <p>Resumen</p>,
} as const;

describe("ConfirmationModal", () => {
  it("uses a drawer for direct actions on mobile", () => {
    viewport.isMobile = true;

    render(<ConfirmationModal {...baseProps} presentation="direct" />);

    expect(screen.getByTestId("drawer")).toBeInTheDocument();
    expect(screen.queryByTestId("alert-dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });

  it("keeps review steps in a dialog on mobile", () => {
    viewport.isMobile = true;

    render(<ConfirmationModal {...baseProps} presentation="review" />);

    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("drawer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver a editar" })).toBeInTheDocument();
  });

  it("uses a dialog for direct actions on desktop", () => {
    viewport.isMobile = false;

    render(<ConfirmationModal {...baseProps} presentation="direct" />);

    expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });
});
