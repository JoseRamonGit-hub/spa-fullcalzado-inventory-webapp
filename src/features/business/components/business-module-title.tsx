import type { ReactNode } from "react";
import { BusinessSwitcher } from "@/features/business/components/business-switcher";
import { useActiveBusiness } from "@/features/business/hooks/useBusinessQueries";
import { getBusinessDotStyle, getBusinessTheme } from "@/features/business/utils/business-theme";
import { cn } from "@/lib/utils";

type BusinessModuleTitleProps = {
  title: string;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function BusinessModuleTitle({ title, children, className, titleClassName }: BusinessModuleTitleProps) {
  const business = useActiveBusiness();
  const theme = getBusinessTheme(business);

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <span className="size-1.5 rounded-full" style={getBusinessDotStyle(theme)} aria-hidden="true" />
      <h1 className={cn("font-heading text-foreground text-sm font-semibold whitespace-nowrap", titleClassName)}>
        {title}
      </h1>
      <BusinessSwitcher variant="badge" />
      {children}
    </div>
  );
}
