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

// Los grupos se separan solo con espacio; el rótulo de cada sección queda para lectores de pantalla.
const SECTION_GROUP_CLASS_NAME = "pt-4 pb-0";

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

      <SidebarContent className="gap-0">
        <SidebarGroup className="pb-0">
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] tracking-widest uppercase">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLinkItem item={DASHBOARD_NAV_ITEM} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {NAV_SECTIONS.map((section) => (
          <SidebarGroup
            key={section.label}
            role="group"
            aria-label={section.label}
            className={SECTION_GROUP_CLASS_NAME}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavLinkItem key={item.url} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup role="group" aria-label={RECEIVABLES_NAV.sectionLabel} className={SECTION_GROUP_CLASS_NAME}>
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
        <div className="grid px-2 pt-1 leading-tight group-data-[collapsible=icon]:hidden">
          <OverflowTooltip className="text-sidebar-foreground text-xs font-medium">
            {user?.fullname || "Usuario"}
          </OverflowTooltip>
          <OverflowTooltip className="text-sidebar-foreground/60 text-[11px]">{user?.email || ""}</OverflowTooltip>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              disabled={isLoggingOut}
              tooltip="Cerrar sesión"
              className="text-sidebar-foreground/60 hover:bg-red-400/10 hover:text-red-400"
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
