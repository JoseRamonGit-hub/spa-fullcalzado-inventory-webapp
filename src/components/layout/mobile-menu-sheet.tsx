import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useLogout } from "@/features/auth/login/hooks/useLogout";
import { useTheme } from "next-themes";
import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, LogOut } from "lucide-react";
import { BusinessSwitcher } from "@/features/business/components/business-switcher";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";
import {
  MOBILE_PRIMARY_NAV,
  NAV_SECTIONS,
  RECEIVABLES_NAV,
  SETTINGS_NAV_ITEM,
  USERS_NAV_ITEM,
  type NavSection,
} from "./navigation";

const primaryUrls = new Set(MOBILE_PRIMARY_NAV.map((item) => item.url));

const MOBILE_SECTIONS: readonly NavSection[] = [
  ...NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !primaryUrls.has(item.url)),
  })).filter((section) => section.items.length > 0),
  {
    label: RECEIVABLES_NAV.sectionLabel,
    items: RECEIVABLES_NAV.items.map((item) => ({ ...item, title: `${RECEIVABLES_NAV.title} ${item.title}` })),
  },
];

const sectionHeadingClassName = "text-muted-foreground mb-2 text-xs font-semibold";

const menuRowClassName = "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors";

function MobileNavLink({
  item,
  currentPath,
  onNavigate,
}: {
  item: NavSection["items"][number];
  currentPath: string;
  onNavigate: () => void;
}) {
  const isActive = currentPath.startsWith(item.url);

  return (
    <Link
      to={item.url}
      onClick={onNavigate}
      className={cn(
        menuRowClassName,
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground hover:bg-accent hover:text-foreground font-medium",
      )}
    >
      <item.icon className="size-5" />
      <span className="text-sm">{item.title}</span>
    </Link>
  );
}

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
          <DrawerDescription className="sr-only">
            Cambia de negocio y accede a la navegación, el tema y la sesión.
          </DrawerDescription>
          <div className="flex items-center gap-3">
            <div className="bg-muted text-foreground ring-border/70 flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1">
              {user?.fullname?.charAt(0) || "U"}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <OverflowTooltip className="text-sm font-semibold">{user?.fullname || "Usuario"}</OverflowTooltip>
              <OverflowTooltip className="text-muted-foreground text-[11px]">{user?.email || ""}</OverflowTooltip>
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

          <nav aria-label="Navegación">
            {MOBILE_SECTIONS.map((section) => (
              <div key={section.label} className="px-4 py-2">
                <h4 className={sectionHeadingClassName}>{section.label}</h4>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <MobileNavLink
                      key={item.url}
                      item={item}
                      currentPath={currentPath}
                      onNavigate={() => onOpenChange(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-2 border-t px-4 pt-4 pb-2">
            <h4 className={sectionHeadingClassName}>Sistema</h4>
            <div className="flex flex-col gap-1">
              {user?.role === "admin" ? (
                <MobileNavLink item={USERS_NAV_ITEM} currentPath={currentPath} onNavigate={() => onOpenChange(false)} />
              ) : null}
              <MobileNavLink
                item={SETTINGS_NAV_ITEM}
                currentPath={currentPath}
                onNavigate={() => onOpenChange(false)}
              />
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(menuRowClassName, "text-foreground hover:bg-accent font-medium")}
              >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                <span className="flex-1 text-sm">Modo {theme === "dark" ? "Claro" : "Oscuro"}</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(menuRowClassName, "text-destructive hover:bg-destructive/10 font-medium")}
              >
                <LogOut className="size-5" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
