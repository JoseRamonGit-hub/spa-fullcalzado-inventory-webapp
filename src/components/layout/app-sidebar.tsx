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
import { ChevronRight, LogOut } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useLogout } from "@/features/auth/login/hooks/useLogout";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { BusinessSwitcher } from "@/features/business/components/business-switcher";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_NAV_ITEM,
  NAV_SECTIONS,
  RECEIVABLES_NAV,
  SETTINGS_NAV_ITEM,
  USERS_NAV_ITEM,
  type NavItem,
} from "./navigation";

const ACTIVE_LINK_CLASS_NAME = "bg-sidebar-accent text-sidebar-primary font-medium";

const GROUP_LABEL_CLASS_NAME = "text-sidebar-foreground/40 text-[10px] tracking-widest uppercase";

function NavLinkItem({ item }: { item: NavItem }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title}>
        <Link to={item.url} activeProps={{ className: ACTIVE_LINK_CLASS_NAME }}>
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Módulo «Cuentas por cobrar»: se despliega con sus subrutas; con la barra contraída lleva a la primera. */
function ReceivablesNavItem() {
  const { state } = useSidebar();
  const isActive = useRouterState({
    select: (routerState) => routerState.location.pathname.startsWith(RECEIVABLES_NAV.url),
  });

  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={RECEIVABLES_NAV.title}>
          <Link to={RECEIVABLES_NAV.items[0].url} className={cn(isActive && ACTIVE_LINK_CLASS_NAME)}>
            <RECEIVABLES_NAV.icon className="size-4" />
            <span>{RECEIVABLES_NAV.title}</span>
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
            tooltip={RECEIVABLES_NAV.title}
            className={cn(isActive && "text-sidebar-primary font-medium")}
          >
            <RECEIVABLES_NAV.icon className="size-4" />
            <span>{RECEIVABLES_NAV.title}</span>
            <ChevronRight
              aria-hidden="true"
              className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {RECEIVABLES_NAV.items.map((item) => (
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
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLinkItem item={DASHBOARD_NAV_ITEM} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className={GROUP_LABEL_CLASS_NAME}>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavLinkItem key={item.url} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel className={GROUP_LABEL_CLASS_NAME}>{RECEIVABLES_NAV.sectionLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <ReceivablesNavItem />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {user?.role === "admin" ? <NavLinkItem item={USERS_NAV_ITEM} /> : null}
              <NavLinkItem item={SETTINGS_NAV_ITEM} />
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
