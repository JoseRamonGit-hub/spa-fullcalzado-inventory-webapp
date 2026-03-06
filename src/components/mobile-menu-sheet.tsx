import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAuthStore } from "@/features/auth/store";
import { useLogout } from "@/features/auth/login/hooks";
import { useTheme } from "next-themes";
import { Link, useRouterState } from "@tanstack/react-router";
import { Settings, ReceiptText, Moon, Sun, LogOut } from "lucide-react";

export function MobileMenuSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme } = useTheme();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleLogout = () => {
    onOpenChange(false);
    logout();
  };

  const secondaryNav = [
    { title: "Cierres de Caja", url: "/cash-closes", icon: ReceiptText },
    { title: "Ajustes", url: "/settings", icon: Settings },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-[85vw] sm:max-w-sm h-full rounded-none border-l flex flex-col after:hidden">
        <DrawerHeader className="p-4  border-b text-left">
          <DrawerTitle className="sr-only">Menú Principal</DrawerTitle>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-lg"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
                color: "oklch(0.99 0.002 75)",
              }}
            >
              {user?.fullname?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold truncate">{user?.fullname || "Usuario"}</span>
              <span className="text-[11px] text-muted-foreground truncate">{user?.email || ""}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/12 text-primary font-semibold shrink-0">
              {user?.role || "—"}
            </span>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto py-2">
          <div className="px-4 py-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Navegación
            </h4>
            <nav className="flex flex-col gap-1">
              {secondaryNav.map((item) => {
                const isActive = currentPath.startsWith(item.url);
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => onOpenChange(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-accent hover:text-foreground font-medium"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="px-4 pt-4 pb-2 mt-2 border-t">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sistema</h4>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-foreground hover:bg-accent font-medium text-left"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="text-sm flex-1">Modo {theme === "dark" ? "Claro" : "Oscuro"}</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-destructive hover:bg-destructive/10 font-medium text-left"
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
