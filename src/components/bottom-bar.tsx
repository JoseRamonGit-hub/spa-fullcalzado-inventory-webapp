import { Link, useRouterState } from "@tanstack/react-router";
import { Package, ArrowLeftRight, Plus, Tags, Menu, IterationCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { PackagePlus, ShoppingCart } from "lucide-react";
import { useModalStore } from "@/hooks/useModalStore";
import { MobileMenuSheet } from "./mobile-menu-sheet";

export function BottomBar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { setInModalOpen, setOutModalOpen, setReturnModalOpen } = useModalStore();

  const renderNavItem = (title: string, url: string, Icon: React.ElementType) => {
    const isActive = currentPath.startsWith(url);
    return (
      <Link
        key={title}
        to={url}
        className={cn(
          "relative flex h-full w-14 flex-col items-center justify-center gap-0.5 py-1 transition-colors",
          isActive ? "text-primary" : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80",
        )}
      >
        {isActive && <span className="bg-primary absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" />}
        <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
        <span className={cn("mt-0.5 text-[9px] leading-none", isActive ? "font-bold" : "font-medium")}>{title}</span>
      </Link>
    );
  };

  return (
    <>
      <nav
        className="border-sidebar-border bottombar-height pb-safe fixed right-0 bottom-0 left-0 z-50 border-t md:hidden"
        style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
      >
        <div className="grid h-full grid-cols-5 items-center justify-items-center px-1">
          {/* Item 1: Inventario */}
          {renderNavItem("Inventario", "/inventory", Package)}

          {/* Item 2: Ventas */}
          {renderNavItem("Ventas", "/transactions", Tags)}

          {/* Item 3: FAB Central — The Protagonist */}
          <div className="relative flex h-full w-full flex-col items-center justify-center">
            <div className="relative -mt-8">
              {/* Pulsing ring */}
              <span className="bg-primary/30 fab-ping absolute inset-0 rounded-full" />
              <button
                onClick={() => setActionDrawerOpen(true)}
                className="bg-primary text-primary-foreground fab-glow relative flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-95"
                aria-label="Nueva acción"
              >
                <Plus className="h-7 w-7 stroke-3" />
              </button>
            </div>
          </div>

          {/* Item 4: Movimientos */}
          {renderNavItem("Movs", "/movements", ArrowLeftRight)}

          {/* Item 5: Menú Escalable */}
          <button
            onClick={() => setMenuOpen(true)}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground/80 flex h-full w-14 flex-col items-center justify-center gap-0.5 py-1 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
            <span className="mt-0.5 text-[9px] leading-none font-medium">Menú</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Sheet (Scalable container) */}
      <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />

      {/* Action Drawer for Carga de inventario / Venta */}
      <Drawer open={actionDrawerOpen} onOpenChange={setActionDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-sm font-bold tracking-wide uppercase">¿Qué desea hacer?</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4 pb-10">
            <Button
              variant="outline"
              className="bg-card h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => {
                setActionDrawerOpen(false);
                setInModalOpen(true);
              }}
            >
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <PackagePlus className="text-primary h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">Registrar Ingreso</span>
                <span className="text-muted-foreground text-xs">Agregar productos al inventario</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-card h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => {
                setActionDrawerOpen(false);
                setOutModalOpen(true);
              }}
            >
              <div className="bg-success/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <ShoppingCart className="text-success h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">Registrar Venta</span>
                <span className="text-muted-foreground text-xs">Vender un producto del inventario</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="bg-card h-14 w-full justify-start gap-3 px-4 text-base"
              onClick={() => {
                setActionDrawerOpen(false);
                setReturnModalOpen(true);
              }}
            >
              <div className="bg-refund/12 flex h-10 w-10 items-center justify-center rounded-lg">
                <IterationCcw className="text-refund h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">Registrar Devolución</span>
                <span className="text-muted-foreground text-xs">Cambio o devolución de producto</span>
              </div>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
