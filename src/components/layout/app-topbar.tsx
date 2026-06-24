import { useEffect } from "react";
import { IterationCcw, Moon, PackagePlus, ShoppingCart, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { useExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { useModalStore } from "@/components/modals/store/useModalStore";
import { formatCurrencyVES } from "@/utils/formatters";

const ACTION_BUTTON_CLASS =
  "text-foreground hover:text-primary hover:bg-primary/8 hidden h-7 gap-1.5 px-2 text-xs md:inline-flex [&_svg]:size-3.5";

export function AppTopbar() {
  const setInModalOpen = useModalStore((state) => state.setInModalOpen);
  const setOutModalOpen = useModalStore((state) => state.setOutModalOpen);
  const setReturnModalOpen = useModalStore((state) => state.setReturnModalOpen);
  const { data: exchangeRate, isLoading: isExchangeRateLoading } = useExchangeRate();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const hasActiveBusiness = useBusinessStore((state) => !!state.activeBusinessId);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasActiveBusiness || !(event.ctrlKey || event.metaKey)) return;

      const modalByKey = {
        i: setInModalOpen,
        j: setOutModalOpen,
        k: setReturnModalOpen,
      } as const;
      const openModal = modalByKey[event.key.toLowerCase() as keyof typeof modalByKey];

      if (openModal) {
        event.preventDefault();
        openModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasActiveBusiness, setInModalOpen, setOutModalOpen, setReturnModalOpen]);

  const hasExchangeRate = !!exchangeRate?.rate;
  const isExchangeRateUnavailable = !isExchangeRateLoading && !hasExchangeRate;
  const exchangeRateDisplayValue = hasExchangeRate ? formatCurrencyVES(exchangeRate.rate) : "Sin tasa vigente";

  return (
    <header className="topbar-height border-border bg-card/80 flex shrink-0 items-center justify-between gap-2 border-b px-3 backdrop-blur-sm md:px-4">
      <div className="flex items-center gap-1.5">
        <SidebarTrigger className="hidden md:inline-flex" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInModalOpen(true)}
          disabled={!hasActiveBusiness}
          className={ACTION_BUTTON_CLASS}
        >
          <PackagePlus />
          <span>Carga de Inventario</span>
          <kbd className="kbd hidden lg:inline-flex">Ctrl+I</kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOutModalOpen(true)}
          disabled={!hasActiveBusiness}
          className={ACTION_BUTTON_CLASS}
        >
          <ShoppingCart />
          <span>Venta</span>
          <kbd className="kbd hidden lg:inline-flex">Ctrl+J</kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReturnModalOpen(true)}
          disabled={!hasActiveBusiness}
          className={ACTION_BUTTON_CLASS}
        >
          <IterationCcw />
          <span>Devolución</span>
          <kbd className="kbd hidden lg:inline-flex">Ctrl+K</kbd>
        </Button>

        <div className="flex items-center gap-1.5 md:hidden">
          <span className="text-foreground max-w-30 truncate text-xs font-medium">{user?.fullname || "Usuario"}</span>
          <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
            {user?.role || "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="size-7 p-0 [&_svg]:size-3.5"
        >
          <Sun className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Cambiar tema</span>
        </Button>

        <div
          className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 ${
            isExchangeRateUnavailable ? "border-warning/30 bg-warning/10" : "bg-primary/8 border-primary/20"
          }`}
        >
          <span
            className={`hidden text-[10px] font-semibold tracking-wider uppercase sm:inline ${
              isExchangeRateUnavailable ? "text-warning" : "text-primary/70"
            }`}
          >
            TASA
          </span>
          {isExchangeRateLoading ? (
            <Skeleton className="h-4 w-18" />
          ) : (
            <span
              className={`font-mono text-xs leading-none font-bold tabular-nums ${
                isExchangeRateUnavailable ? "text-warning" : "text-primary"
              }`}
            >
              {exchangeRateDisplayValue}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
