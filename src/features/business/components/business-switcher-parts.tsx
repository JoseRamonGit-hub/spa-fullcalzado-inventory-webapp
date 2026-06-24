import { Check, ChevronRight, ChevronsUpDown, SportShoe } from "lucide-react";
import { CommandItem } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { getBusinessInitials } from "@/features/business/utils/business-display";
import {
  getBusinessAccentStyle,
  getBusinessIconStyle,
  type BusinessTheme,
} from "@/features/business/utils/business-theme";
import { cn } from "@/lib/utils";
import type { Business } from "@/types";

export type BusinessSwitcherVariant = "sidebar" | "mobile" | "badge";

export function BusinessSwitcherSkeleton({ variant }: { variant: BusinessSwitcherVariant }) {
  if (variant === "badge") {
    return <Skeleton className="size-6 rounded-md md:hidden" />;
  }

  if (variant === "mobile") {
    return <Skeleton className="h-12 w-full" />;
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Skeleton className="size-8 rounded-lg" />
      <div className="flex flex-1 flex-col gap-1 group-data-[collapsible=icon]:hidden">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function BusinessTriggerContent({
  businessName,
  canSwitch,
  theme,
  variant,
}: {
  businessName: string;
  canSwitch: boolean;
  theme: BusinessTheme;
  variant: BusinessSwitcherVariant;
}) {
  if (variant === "badge") {
    return <span className="font-mono text-[10px] font-bold tracking-wide">{getBusinessInitials(businessName)}</span>;
  }

  const isSidebar = variant === "sidebar";

  return (
    <>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={getBusinessIconStyle(theme)}>
        <SportShoe className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left leading-none">
        <span className={cn("truncate text-sm font-semibold", isSidebar && "text-sidebar-foreground")}>
          {businessName}
        </span>
        <span
          className={cn("truncate text-[11px]", isSidebar ? "text-sidebar-foreground/50" : "text-muted-foreground")}
        >
          {canSwitch ? "Cambiar negocio" : "Inventario del negocio"}
        </span>
      </div>
      {canSwitch ? <ChevronsUpDown className="ml-auto" /> : null}
    </>
  );
}

export function BusinessOption({
  business,
  isActive,
  onSelect,
  theme,
}: {
  business: Business;
  isActive: boolean;
  onSelect: () => void;
  theme: BusinessTheme;
}) {
  const accentStyle = getBusinessAccentStyle(theme);

  return (
    <CommandItem
      value={`${business.name} ${business.slug}`}
      onSelect={onSelect}
      aria-current={isActive ? "true" : undefined}
      style={isActive ? accentStyle : undefined}
      className={cn(
        "min-h-16 cursor-pointer gap-3 rounded-lg border border-transparent px-2.5 py-2",
        "hover:border-border hover:bg-accent/70",
        "text-foreground data-[selected=true]:border-transparent data-[selected=true]:bg-transparent",
        "data-[selected=true]:hover:border-border data-[selected=true]:hover:bg-accent/70",
        isActive && "shadow-sm",
      )}
    >
      <div
        className={cn(
          "bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg",
          isActive && "text-current",
        )}
        style={isActive ? accentStyle : undefined}
      >
        <SportShoe className="size-5 text-current" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-foreground truncate text-sm font-semibold">{business.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {isActive ? "Negocio actual" : "Cambiar a este negocio"}
        </span>
      </div>

      {isActive ? (
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full"
          style={getBusinessIconStyle(theme)}
        >
          <Check className="size-3.5 text-current" />
          <span className="sr-only">Seleccionado</span>
        </span>
      ) : (
        <ChevronRight className="text-muted-foreground/60 size-4" />
      )}
    </CommandItem>
  );
}
