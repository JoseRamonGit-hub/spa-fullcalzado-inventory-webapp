import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "../components/app-sidebar";
import { BottomBar } from "../components/bottom-bar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DollarSign, PackagePlus, ShoppingCart, Moon, Sun } from "lucide-react";
import { IngresoModal } from "@/components/modals/ingreso-modal";
import { VentaModal } from "@/components/modals/venta-modal";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { useEffect, useCallback } from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/features/auth/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { ingresoOpen, ventaOpen, setIngresoOpen, setVentaOpen } = useModalStore();
  const { data: exchangeRate } = useExchangeRate();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "i" || e.key === "I") {
          e.preventDefault();
          setIngresoOpen(true);
        }
        if (e.key === "j" || e.key === "J") {
          e.preventDefault();
          setVentaOpen(true);
        }
      }
    },
    [setIngresoOpen, setVentaOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const rateDisplay = exchangeRate?.rate
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(exchangeRate.rate)
    : "—";

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="flex topbar-height shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur-sm px-3 md:px-4">
          <div className="flex items-center gap-1.5">
            <SidebarTrigger className="hidden md:inline-flex" />
            {/* Desktop-only action buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIngresoOpen(true)}
              className="hidden md:inline-flex h-7 gap-1.5 text-xs px-2 text-foreground hover:text-primary hover:bg-primary/5"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              <span>Ingreso</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl+I</kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVentaOpen(true)}
              className="hidden md:inline-flex h-7 gap-1.5 text-xs px-2 text-foreground hover:text-primary hover:bg-primary/5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Venta</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl+J</kbd>
            </Button>

            {/* Mobile-only: user name + role */}
            <div className="flex items-center gap-1.5 md:hidden">
              <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                {user?.fullname || "Usuario"}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {user?.role || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-7 w-7 p-0">
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* BCV rate */}
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground hidden sm:inline font-medium">BCV</span>
            <span className="text-xs font-mono tabular-nums font-medium text-foreground">{rateDisplay}</span>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden pb-[var(--bottombar-height)] md:pb-0">
          <Outlet />
        </div>
      </SidebarInset>

      <BottomBar />

      <IngresoModal open={ingresoOpen} onOpenChange={setIngresoOpen} />
      <VentaModal open={ventaOpen} onOpenChange={setVentaOpen} />
    </SidebarProvider>
  );
}
