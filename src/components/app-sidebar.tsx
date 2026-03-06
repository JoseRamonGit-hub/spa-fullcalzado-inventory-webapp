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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  ReceiptText,
  ArrowLeftRight,
  LogOut,
  Package,
  ShoppingBag,
  PackagePlus,
  ShoppingCart,
  Settings,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLogout } from "@/features/auth/login/hooks";
import { useAuthStore } from "@/features/auth/store";
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
      className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-primary-foreground shrink-0"
      style={{
        background: "linear-gradient(135deg, oklch(0.55 0.2 270), oklch(0.45 0.18 280))",
      }}
    >
      {initials}
    </div>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const { mutate } = useLogout();
  const { setIngresoOpen, setVentaOpen } = useModalStore();

  const handleLogOut = () => {
    mutate(undefined, {
      onSuccess: () => {
        navigate({ to: "/login" });
      },
    });
  };

  const user = useAuthStore((state) => state.user);

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="hidden md:flex">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/inventory">
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-lg text-white"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.55 0.2 270), oklch(0.45 0.18 280))",
                  }}
                >
                  <ShoppingBag className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm">ShoeStock</span>
                  <span className="text-[11px] text-muted-foreground">Inventario</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
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
                        className: "bg-sidebar-accent text-primary font-medium",
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

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Acciones Rápidas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Registrar Ingreso"
                  onClick={() => setIngresoOpen(true)}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  <PackagePlus className="size-4" />
                  <span>Registrar Ingreso</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Registrar Venta"
                  onClick={() => setVentaOpen(true)}
                  className="text-muted-foreground hover:text-success hover:bg-success/5"
                >
                  <ShoppingCart className="size-4" />
                  <span>Registrar Venta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                      className: "bg-sidebar-accent text-primary font-medium",
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={user?.fullname || "Usuario"}>
              <div className="flex items-center w-full gap-2">
                <UserInitials name={user?.fullname || "U"} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-xs">{user?.fullname || "Usuario"}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{user?.email || ""}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogOut}
              tooltip="Cerrar sesión"
              className="text-muted-foreground hover:text-destructive"
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
