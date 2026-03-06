import { Link, useRouterState } from "@tanstack/react-router";
import { Package, ArrowLeftRight, Plus, Tags, Menu } from "lucide-react";
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
  const { setIngresoOpen, setVentaOpen } = useModalStore();

  const renderNavItem = (title: string, url: string, Icon: React.ElementType) => {
    const isActive = currentPath.startsWith(url);
    return (
      <Link
        key={title}
        to={url}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 w-[56px] h-full py-1 transition-colors relative",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
        <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
        <span className={cn("text-[9px] leading-none mt-0.5", isActive ? "font-bold" : "font-medium")}>{title}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-md bottombar-height pb-safe">
        <div className="grid grid-cols-5 items-center justify-items-center h-full px-1">
          {/* Item 1: Inventario */}
          {renderNavItem("Inventario", "/inventory", Package)}

          {/* Item 2: Ventas */}
          {renderNavItem("Ventas", "/transactions", Tags)}

          {/* Item 3: FAB Central */}
          <div className="flex flex-col items-center justify-center w-full h-full relative">
            <button
              onClick={() => setActionDrawerOpen(true)}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 -mt-6 active:scale-95 transition-transform"
              style={{ minWidth: 48, minHeight: 48 }}
              aria-label="Nueva acción"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
          </div>

          {/* Item 4: Movimientos */}
          {renderNavItem("Movs", "/movements", ArrowLeftRight)}

          {/* Item 5: Menú Escalable */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-[56px] h-full py-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[9px] leading-none mt-0.5 font-medium">Menú</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Sheet (Scalable container) */}
      <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />

      {/* Action Drawer for Ingreso / Venta */}
      <Drawer open={actionDrawerOpen} onOpenChange={setActionDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="text-sm font-bold uppercase tracking-wide">¿Qué deseas hacer?</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full h-14 gap-3 text-base justify-start px-4"
              onClick={() => {
                setActionDrawerOpen(false);
                setIngresoOpen(true);
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <PackagePlus className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Registrar Ingreso</span>
                <span className="text-xs text-muted-foreground">Agregar productos al inventario</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 gap-3 text-base justify-start px-4"
              onClick={() => {
                setActionDrawerOpen(false);
                setVentaOpen(true);
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <ShoppingCart className="w-5 h-5 text-success" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-sm">Registrar Venta</span>
                <span className="text-xs text-muted-foreground">Vender un producto del inventario</span>
              </div>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
