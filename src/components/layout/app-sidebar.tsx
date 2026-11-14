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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ReceiptText,
  ArrowLeftRight,
  ChevronRight,
  HandCoins,
  LayoutDashboard,
  IterationCcw,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useLogout } from "@/features/auth/login/hooks/useLogout";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { BusinessSwitcher } from "@/features/business/components/business-switcher";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Panel principal",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
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
    icon: ShoppingCart,
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

const ACTIVE_LINK_CLASS_NAME = "bg-sidebar-accent text-sidebar-primary font-medium";

const RECEIVABLES_ITEMS = [
  {
    title: "Cashea",
    url: "/receivables/cashea",
    icon: CasheaLogoIcon,
  },
] as const;

/** Módulo «Cuentas por cobrar»: se despliega con sus subrutas; con la barra contraída lleva a la primera. */
function ReceivablesNavItem() {
  const { state } = useSidebar();
  const isActive = useRouterState({
    select: (routerState) => routerState.location.pathname.startsWith("/receivables"),
  });

  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Cuentas por cobrar">
          <Link to={RECEIVABLES_ITEMS[0].url} className={cn(isActive && ACTIVE_LINK_CLASS_NAME)}>
            <HandCoins className="size-4" />
            <span>Cuentas por cobrar</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip="Cuentas por cobrar"
            className={cn(isActive && "text-sidebar-primary font-medium")}
          >
            <HandCoins className="size-4" />
            <span>Cuentas por cobrar</span>
            <ChevronRight
              aria-hidden="true"
              className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {RECEIVABLES_ITEMS.map((item) => (
              <SidebarMenuSubItem key={item.url}>
                <SidebarMenuSubButton asChild>
                  <Link to={item.url} activeProps={{ className: ACTIVE_LINK_CLASS_NAME }}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

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
              <ReceivablesNavItem />
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
                  <OverflowTooltip className="text-sidebar-foreground text-xs font-medium">
                    {user?.fullname || "Usuario"}
                  </OverflowTooltip>
                  <OverflowTooltip className="text-sidebar-foreground/50 text-[11px]">
                    {user?.email || ""}
                  </OverflowTooltip>
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
