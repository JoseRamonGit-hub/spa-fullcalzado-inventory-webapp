import { useActiveBusiness } from "@/features/business/hooks/useBusinessQueries";
import { getBusinessDotStyle, getBusinessTheme } from "@/features/business/utils/business-theme";
import { cn } from "@/lib/utils";

export function ActiveBusinessContext({ className }: { className?: string }) {
  const business = useActiveBusiness();

  if (!business) return null;

  const theme = getBusinessTheme(business);

  return (
    <div className={cn("text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px]", className)}>
      <span className="size-1.5 shrink-0 rounded-full" style={getBusinessDotStyle(theme)} aria-hidden="true" />
      <span className="shrink-0">Operando en</span>
      <strong className="text-foreground truncate font-semibold">{business.name}</strong>
    </div>
  );
}
