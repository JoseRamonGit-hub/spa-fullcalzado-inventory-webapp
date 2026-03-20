import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "../components/app-sidebar";
import { BottomBar } from "../components/bottom-bar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PackagePlus, ShoppingCart, IterationCcw, Moon, Sun } from "lucide-react";
import { InModal } from "@/components/modals/in-modal";
import { OutModal } from "@/components/modals/out-modal";
import { ReturnModal } from "@/components/modals/return-modal";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { useEffect, useCallback } from "react";
import { useModalStore } from "@/hooks/useModalStore";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { formatCurrencyVES } from "@/utils/formatters";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    // Root route already ran getAuthenticatedProfile() and hydrated the store.
    // This guard is a lightweight synchronous check — no network call needed.
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { isInModalOpen, isOutModalOpen, isReturnModalOpen, setInModalOpen, setOutModalOpen, setReturnModalOpen } =
    useModalStore();
  const { data: exchangeRate } = useExchangeRate();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const sidebarOpen = useSidebarStore((s) => s.open);
  const setSidebarOpen = useSidebarStore((s) => s.setOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "i" || e.key === "I") {
          e.preventDefault();
          setInModalOpen(true);
        }
        if (e.key === "j" || e.key === "J") {
          e.preventDefault();
          setOutModalOpen(true);
        }
        if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          setReturnModalOpen(true);
        }
      }
    },
    [setInModalOpen, setOutModalOpen, setReturnModalOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const rateDisplay = exchangeRate?.rate ? formatCurrencyVES(exchangeRate.rate) : "—";

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <SidebarProvider className="h-dvh" open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar />
      <SidebarInset className="bg-card overflow-hidden shadow-sm">
        <header className="topbar-height border-border bg-card/80 flex shrink-0 items-center justify-between gap-2 border-b px-3 backdrop-blur-sm md:px-4">
          <div className="flex items-center gap-1.5">
            <SidebarTrigger className="hidden md:inline-flex" />
            {/* Desktop-only action buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInModalOpen(true)}
              className="text-foreground hover:text-primary hover:bg-primary/8 hidden h-7 gap-1.5 px-2 text-xs md:inline-flex"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              <span>Carga de Inventario</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl+I</kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOutModalOpen(true)}
              className="text-foreground hover:text-primary hover:bg-primary/8 hidden h-7 gap-1.5 px-2 text-xs md:inline-flex"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Venta</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl+J</kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReturnModalOpen(true)}
              className="text-foreground hover:text-primary hover:bg-primary/8 hidden h-7 gap-1.5 px-2 text-xs md:inline-flex"
            >
              <IterationCcw className="h-3.5 w-3.5" />
              <span>Devolución</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl+K</kbd>
            </Button>

            {/* Mobile-only: user name + role */}
            <div className="flex items-center gap-1.5 md:hidden">
              <span className="text-foreground max-w-30 truncate text-xs font-medium">
                {user?.fullname || "Usuario"}
              </span>
              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
                {user?.role || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-7 w-7 p-0">
              <Sun className="h-3.5 w-3.5 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-3.5 w-3.5 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="bg-primary/8 border-primary/20 flex items-center gap-1.5 rounded-md border px-2 py-0.5">
              <span className="text-primary/70 hidden text-[10px] font-semibold tracking-wider uppercase sm:inline">
                TASA
              </span>
              <span className="text-primary font-mono text-sm leading-none font-bold tabular-nums">{rateDisplay}</span>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-(--bottombar-height) md:pb-0">
          <Outlet />
        </div>
      </SidebarInset>

      <BottomBar />

      <InModal isOpen={isInModalOpen} onOpenChange={setInModalOpen} />
      <OutModal isOpen={isOutModalOpen} onOpenChange={setOutModalOpen} />
      <ReturnModal isOpen={isReturnModalOpen} onOpenChange={setReturnModalOpen} />
    </SidebarProvider>
  );
}
