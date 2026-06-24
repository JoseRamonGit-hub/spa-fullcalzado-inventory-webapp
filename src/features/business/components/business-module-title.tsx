import type { ReactNode } from "react";
import { BusinessSwitcher } from "@/features/business/components/business-switcher";
import { useActiveBusiness } from "@/features/business/hooks/useBusinessQueries";
import { getBusinessDotStyle, getBusinessTheme } from "@/features/business/utils/business-theme";

type BusinessModuleTitleProps = {
  title: string;
  children?: ReactNode;
};

export function BusinessModuleTitle({ title, children }: BusinessModuleTitleProps) {
  const business = useActiveBusiness();
  const theme = getBusinessTheme(business);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={getBusinessDotStyle(theme)} aria-hidden="true" />
      <h1 className="font-heading text-foreground text-sm font-semibold whitespace-nowrap">{title}</h1>
      <BusinessSwitcher variant="badge" />
      {children}
    </div>
  );
}
