import { BusinessModuleTitle } from "@/features/business/components/business-module-title";

export function Topbar() {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <BusinessModuleTitle title="Ventas" />
    </header>
  );
}
