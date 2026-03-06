import { Link, useRouterState } from "@tanstack/react-router";
import { Package, ArrowLeftRight, ReceiptText, Plus, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { PackagePlus, ShoppingCart } from "lucide-react";
import { useModalStore } from "@/hooks/useModalStore";

const navItems = [
  {
    title: "Inventario",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Movimientos",
    url: "/movements",
    icon: ArrowLeftRight,
  },
];

const rightItems = [
  {
    title: "Ventas",
    url: "/transactions",
    icon: Tags,
  },
  {
    title: "Cierres",
    url: "/cash-closes",
    icon: ReceiptText,
  },
];

export function BottomBar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const { setIngresoOpen, setVentaOpen } = useModalStore();

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = currentPath.startsWith(item.url);
    return (
      <Link
        key={item.title}
        to={item.url}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 transition-colors relative",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
        <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
        <span className={cn("text-[10px] leading-none", isActive ? "font-semibold" : "font-medium")}>{item.title}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-md bottombar-height safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2">
          {/* Left nav items */}
          {navItems.map(renderNavItem)}

          {/* Central FAB "+" button */}
          <div className="flex flex-col items-center justify-center flex-1 h-full relative">
            <button
              onClick={() => setActionDrawerOpen(true)}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 -mt-5 active:scale-95 transition-transform"
              style={{ minWidth: 48, minHeight: 48 }}
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Right nav items */}
          {rightItems.map(renderNavItem)}
        </div>
      </nav>

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
