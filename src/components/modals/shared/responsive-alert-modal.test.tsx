import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveAlertModal } from "./responsive-alert-modal";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));
vi.mock("@/features/business/components/active-business-context", () => ({
  ActiveBusinessContext: () => <p>Negocio activo</p>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => <button {...props}>{children}</button>,
}));
vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerContent: ({ children, className }: React.ComponentProps<"section">) => (
    <section data-testid="drawer" className={className}>
      {children}
    </section>
  ),
  DrawerHeader: ({ children, className }: React.ComponentProps<"header">) => (
    <header className={className}>{children}</header>
  ),
  DrawerTitle: ({ children, className }: React.ComponentProps<"h2">) => <h2 className={className}>{children}</h2>,
  DrawerDescription: ({ children, className }: React.ComponentProps<"p">) => <p className={className}>{children}</p>,
  DrawerFooter: ({ children, className }: React.ComponentProps<"footer">) => (
    <footer className={className}>{children}</footer>
  ),
  DrawerClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ResponsiveAlertModal", () => {
  it("keeps the mobile action footer reachable while its detail area scrolls", () => {
    render(
      <ResponsiveAlertModal
        open
        onOpenChange={vi.fn()}
        title="Confirmar cierre"
        description="Revisa el resumen."
        confirmLabel="Cerrar caja"
        isPending={false}
        onConfirm={vi.fn()}
      >
        <div>Detalle del cierre</div>
      </ResponsiveAlertModal>,
    );

    expect(screen.getByTestId("drawer")).toHaveClass("max-h-[calc(100dvh-1rem)]");
    expect(screen.getByText("Detalle del cierre").parentElement).toHaveClass("flex-1", "overflow-y-auto");
    expect(screen.getByRole("button", { name: "Cerrar caja" }).closest("footer")).toHaveClass(
      "shrink-0",
      "pb-[max(1rem,env(safe-area-inset-bottom))]",
    );
  });
});
