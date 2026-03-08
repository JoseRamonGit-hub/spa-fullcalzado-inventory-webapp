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
import { ReceiptText, ArrowLeftRight, LogOut, Package, ShoppingBag, Settings, Tags } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLogout } from "@/features/auth/login/hooks";
import { useAuthStore } from "@/features/auth/store";

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
  {
    title: "Ventas",
    url: "/transactions",
    icon: Tags,
  },
  {
    title: "Cierres de Caja",
    url: "/cash-closes",
    icon: ReceiptText,
  },
];

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
      style={{
        background: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
        color: "oklch(0.99 0.002 75)",
      }}
    >
      {initials}
    </div>
  );
}

export function AppSidebar() {
  const { mutate: logout } = useLogout();

  const handleLogOut = () => logout();

  const user = useAuthStore((state) => state.user);

  return (
    <Sidebar variant="inset" collapsible="icon" className="hidden md:flex">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/inventory">
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
                    color: "oklch(0.99 0.002 75)",
                  }}
                >
                  <ShoppingBag className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-sidebar-foreground text-sm font-semibold">Full Calzado</span>
                  <span className="text-sidebar-foreground/50 text-[11px]">Inventario</span>
                </div>
              </Link>
            </SidebarMenuButton>
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
              {navItems.map((item) => (
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

        {/* Settings link at the bottom of content, before footer */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
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
            <SidebarMenuButton asChild tooltip={user?.fullname || "Usuario"}>
              <div className="flex w-full items-center gap-2">
                <UserInitials name={user?.fullname || "U"} />
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
              onClick={handleLogOut}
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
