import type { ComponentType } from "react";
import {
  ArrowLeftRight,
  HandCoins,
  IterationCcw,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DashboardPanel } from "@/components/icons/dashboard-panel";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";

export type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

export type NavSection = {
  label: string;
  items: readonly NavItem[];
};

const DASHBOARD = { title: "Panel principal", url: "/dashboard", icon: DashboardPanel };
const INVENTORY = { title: "Inventario", url: "/inventory", icon: Package };
const SALES = { title: "Ventas", url: "/transactions", icon: ShoppingCart };

export const DASHBOARD_NAV_ITEM: NavItem = DASHBOARD;

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: "Inventario",
    items: [INVENTORY, { title: "Movimientos", url: "/movements", icon: ArrowLeftRight }],
  },
  {
    label: "Caja",
    items: [
      SALES,
      { title: "Devoluciones", url: "/returns", icon: IterationCcw },
      { title: "Cierres de Caja", url: "/cash-closes", icon: ReceiptText },
    ],
  },
];

export const RECEIVABLES_NAV = {
  sectionLabel: "Cobranzas",
  title: "Cuentas por cobrar",
  url: "/receivables",
  icon: HandCoins,
  items: [{ title: "Cashea", url: "/receivables/cashea", icon: CasheaLogoIcon }] as readonly NavItem[],
};

export const USERS_NAV_ITEM: NavItem = { title: "Usuarios", url: "/users", icon: Users };

export const SETTINGS_NAV_ITEM: NavItem = { title: "Ajustes", url: "/settings", icon: Settings };

export const MOBILE_PRIMARY_NAV: readonly { title: string; url: string; icon: LucideIcon }[] = [
  { title: "Panel", url: DASHBOARD.url, icon: DASHBOARD.icon },
  { title: INVENTORY.title, url: INVENTORY.url, icon: INVENTORY.icon },
  { title: SALES.title, url: SALES.url, icon: SALES.icon },
];
