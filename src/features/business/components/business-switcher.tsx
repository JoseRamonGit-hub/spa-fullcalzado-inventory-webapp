import { Command, CommandEmpty, CommandGroup, CommandList } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BusinessOption,
  BusinessSwitcherSkeleton,
  BusinessTriggerContent,
  type BusinessSwitcherVariant,
} from "@/features/business/components/business-switcher-parts";
import { useBusinessSwitcher } from "@/features/business/hooks/useBusinessSwitcher";
import { getBusinessInitials } from "@/features/business/utils/business-display";
import { getBusinessAccentStyle, getBusinessTheme } from "@/features/business/utils/business-theme";
import { cn } from "@/lib/utils";

type BusinessSwitcherProps = {
  variant?: BusinessSwitcherVariant;
  onBusinessChanged?: () => void;
};

export function BusinessSwitcher({ variant = "sidebar", onBusinessChanged }: BusinessSwitcherProps) {
  const {
    activeBusiness,
    activeBusinessId,
    businesses,
    canSwitch,
    isPending,
    isTransitioning,
    open,
    setOpen,
    selectBusiness,
  } = useBusinessSwitcher();
  const isSidebar = variant === "sidebar";
  const isBadge = variant === "badge";
  const businessName = activeBusiness?.name ?? "Sin negocio asignado";
  const activeTheme = getBusinessTheme(activeBusiness);
  const activeAccentStyle = getBusinessAccentStyle(activeTheme);

  const handleSelect = (businessId: string) => {
    if (selectBusiness(businessId)) {
      onBusinessChanged?.();
    }
  };

  if (isPending) {
    return <BusinessSwitcherSkeleton variant={variant} />;
  }

  const triggerContent = (
    <BusinessTriggerContent businessName={businessName} canSwitch={canSwitch} theme={activeTheme} variant={variant} />
  );

  if (!canSwitch) {
    if (isBadge) {
      return (
        <Badge
          variant="outline"
          className="h-6 min-w-7 px-1.5 font-mono text-[10px] tracking-wide md:hidden"
          style={activeAccentStyle}
          title={businessName}
          aria-label={`Negocio actual: ${businessName}`}
        >
          {getBusinessInitials(businessName)}
        </Badge>
      );
    }

    return isSidebar ? (
      <SidebarMenuButton asChild size="lg" tooltip={businessName}>
        <div aria-label={businessName}>{triggerContent}</div>
      </SidebarMenuButton>
    ) : (
      <div className="bg-background flex min-h-12 w-full items-center gap-2 rounded-md border px-3 py-2">
        {triggerContent}
      </div>
    );
  }

  const trigger = isBadge ? (
    <Button
      variant="outline"
      size="xs"
      className="h-6 min-w-7 px-1.5 font-mono text-[10px] font-bold tracking-wide transition-opacity hover:opacity-90 md:hidden"
      style={activeAccentStyle}
      aria-label={`Cambiar negocio. Negocio actual: ${businessName}`}
      aria-expanded={open}
      disabled={isTransitioning}
    >
      {triggerContent}
    </Button>
  ) : isSidebar ? (
    <SidebarMenuButton
      size="lg"
      tooltip="Cambiar negocio"
      aria-label={`Cambiar negocio. Negocio actual: ${businessName}`}
      aria-expanded={open}
      disabled={isTransitioning}
    >
      {triggerContent}
    </SidebarMenuButton>
  ) : (
    <Button
      variant="outline"
      className="h-auto w-full justify-start px-3 py-2"
      aria-label={`Cambiar negocio. Negocio actual: ${businessName}`}
      aria-expanded={open}
      disabled={isTransitioning}
    >
      {triggerContent}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={isBadge ? "center" : "start"}
        side={isSidebar ? "right" : "bottom"}
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          "overflow-hidden rounded-xl p-0 shadow-xl",
          isSidebar && "w-80",
          variant === "mobile" && "w-(--radix-popover-trigger-width)",
          isBadge && "w-[min(20rem,calc(100vw-1.5rem))]",
        )}
      >
        <PopoverHeader className="gap-1 border-b px-4 py-3.5">
          <PopoverTitle className="text-sm font-semibold">Seleccionar negocio</PopoverTitle>
          <PopoverDescription className="text-xs leading-relaxed">
            El inventario y las operaciones cambiarán al negocio elegido.
          </PopoverDescription>
        </PopoverHeader>

        <Command aria-label="Negocios disponibles">
          <CommandList className="max-h-72 p-2">
            <CommandEmpty>No hay negocios disponibles.</CommandEmpty>
            <CommandGroup className="p-0 [&_[cmdk-group-items]]:flex [&_[cmdk-group-items]]:flex-col [&_[cmdk-group-items]]:gap-1.5">
              {businesses.map((business) => (
                <BusinessOption
                  key={business.id}
                  business={business}
                  isActive={business.id === activeBusinessId}
                  onSelect={() => handleSelect(business.id)}
                  theme={getBusinessTheme(business)}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
