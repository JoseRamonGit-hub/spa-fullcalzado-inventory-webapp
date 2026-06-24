import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useLogout } from "@/features/auth/login/hooks/useLogout";
import { useTheme } from "next-themes";
import { Link, useRouterState } from "@tanstack/react-router";
import { Settings, ReceiptText, IterationCcw, Moon, Sun, LogOut, Users } from "lucide-react";
import { BusinessSwitcher } from "@/features/business/components/business-switcher";
import { cn } from "@/lib/utils";

const SECONDARY_NAV = [
  { title: "Devoluciones", url: "/returns", icon: IterationCcw },
  { title: "Cierres de Caja", url: "/cash-closes", icon: ReceiptText },
  { title: "Ajustes", url: "/settings", icon: Settings },
];

const ADMIN_NAV = [{ title: "Usuarios", url: "/users", icon: Users }];

export function MobileMenuSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useTheme();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const currentPath = useRouterState({ select: (state) => state.location.pathname });

  const handleLogout = () => {
    onOpenChange(false);
    logout();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full w-[85vw] flex-col rounded-none border-l after:hidden sm:max-w-sm">
        <DrawerHeader className="border-b p-4 text-left">
          <DrawerTitle className="sr-only">Menú Principal</DrawerTitle>
          <div className="flex items-center gap-3">
            <div className="bg-muted text-foreground ring-border/70 flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1">
              {user?.fullname?.charAt(0) || "U"}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{user?.fullname || "Usuario"}</span>
              <span className="text-muted-foreground truncate text-[11px]">{user?.email || ""}</span>
            </div>
            <span className="bg-primary/12 text-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
              {user?.role || "—"}
            </span>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto py-2">
          <div className="px-4 py-2">
            <BusinessSwitcher variant="mobile" onBusinessChanged={() => onOpenChange(false)} />
          </div>

          <div className="px-4 py-2">
            <h4 className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
              Navegación
            </h4>
            <nav className="flex flex-col gap-1">
              {[...(user?.role === "admin" ? ADMIN_NAV : []), ...SECONDARY_NAV].map((item) => {
                const isActive = currentPath.startsWith(item.url);
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-accent hover:text-foreground font-medium",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-2 border-t px-4 pt-4 pb-2">
            <h4 className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">Sistema</h4>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-foreground hover:bg-accent flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-medium transition-colors"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="flex-1 text-sm">Modo {theme === "dark" ? "Claro" : "Oscuro"}</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-medium transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
