import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ReceiptText, ArrowLeftRight, IterationCcw, LogOut, Package, Settings, Tags, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLogout } from "@/features/auth/login/hooks/useLogout";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { BusinessSwitcher } from "@/features/business/components/business-switcher";

const NAV_ITEMS = [
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
  {
    title: "Ventas",
    url: "/transactions",
    icon: Tags,
  },
  {
    title: "Devoluciones",
    url: "/returns",
    icon: IterationCcw,
  },
  {
    title: "Cierres de Caja",
    url: "/cash-closes",
    icon: ReceiptText,
  },
];

export function AppSidebar() {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const user = useAuthStore((state) => state.user);

  return (
    <Sidebar variant="inset" collapsible="icon" className="hidden md:flex">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <BusinessSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] tracking-widest uppercase">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      to={item.url}
                      activeProps={{
                        className: "bg-sidebar-accent text-sidebar-primary font-medium",
                      }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {user?.role === "admin" ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Usuarios">
                    <Link
                      to="/users"
                      activeProps={{
                        className: "bg-sidebar-accent text-sidebar-primary font-medium",
                      }}
                    >
                      <Users className="size-4" />
                      <span>Usuarios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ajustes">
                  <Link
                    to="/settings"
                    activeProps={{
                      className: "bg-sidebar-accent text-sidebar-primary font-medium",
                    }}
                  >
                    <Settings className="size-4" />
                    <span>Ajustes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t">
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton asChild tooltip={user?.fullname || "Usuario"} className="py-6">
              <div className="flex w-full items-center gap-2">
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-sidebar-foreground truncate text-xs font-medium">
                    {user?.fullname || "Usuario"}
                  </span>
                  <span className="text-sidebar-foreground/50 truncate text-[11px]">{user?.email || ""}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              disabled={isLoggingOut}
              tooltip="Cerrar sesión"
              className="text-sidebar-foreground/50 hover:bg-red-400/10 hover:text-red-400"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
