import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight, Menu, Package, Plus, ShoppingCart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MobileQuickActionsDrawer } from "@/components/layout/mobile-quick-actions-drawer";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { MobileMenuSheet } from "./mobile-menu-sheet";

const MOBILE_NAV_ITEMS = [
  { title: "Inventario", url: "/inventory", icon: Package },
  { title: "Ventas", url: "/transactions", icon: ShoppingCart },
  { title: "Movimientos", url: "/movements", icon: ArrowLeftRight },
] as const;

function MobileNavItem({
  title,
  url,
  icon: Icon,
  currentPath,
}: {
  title: string;
  url: string;
  icon: LucideIcon;
  currentPath: string;
}) {
  const isActive = currentPath.startsWith(url);

  return (
    <Link
      to={url}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors",
        isActive ? "text-primary" : "text-sidebar-foreground/65 hover:text-sidebar-foreground",
      )}
    >
      {isActive ? (
        <span className="bg-primary absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" />
      ) : null}
      <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
      <span className={cn("mt-0.5 text-[10px] leading-none", isActive ? "font-bold" : "font-medium")}>{title}</span>
    </Link>
  );
}

export function BottomBar() {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hasActiveBusiness = useBusinessStore((state) => state.activeBusinessId !== null);

  return (
    <>
      <nav
        className="border-sidebar-border bottombar-height pb-safe fixed right-0 bottom-0 left-0 z-50 border-t md:hidden"
        style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}
      >
        <div className="grid h-full grid-cols-5 items-center justify-items-center px-1">
          {MOBILE_NAV_ITEMS.slice(0, 2).map((item) => (
            <MobileNavItem key={item.url} {...item} currentPath={currentPath} />
          ))}

          <div className="relative h-full w-full">
            <button
              onClick={() => setActionDrawerOpen(true)}
              disabled={!hasActiveBusiness}
              className="bg-primary text-primary-foreground fab-glow absolute -top-4 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              aria-label="Nueva operación"
            >
              <Plus className="size-7 stroke-3" />
            </button>
            <span className="text-sidebar-foreground/75 absolute right-0 bottom-1 left-0 text-center text-[10px] leading-none font-medium">
              Nuevo
            </span>
          </div>

          <MobileNavItem {...MOBILE_NAV_ITEMS[2]} currentPath={currentPath} />

          <button
            onClick={() => setMenuOpen(true)}
            className="text-sidebar-foreground/65 hover:text-sidebar-foreground flex h-full w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
            <span className="mt-0.5 text-[10px] leading-none font-medium">Menú</span>
          </button>
        </div>
      </nav>

      <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
      <MobileQuickActionsDrawer open={actionDrawerOpen} onOpenChange={setActionDrawerOpen} />
    </>
  );
}
