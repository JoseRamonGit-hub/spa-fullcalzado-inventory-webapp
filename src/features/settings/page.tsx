import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { getUserRoleLabel } from "@/features/users/utils/user-labels";
import { CasheaSettingsSection } from "./components/cashea-settings-section";
import { ExchangeRateSection } from "./components/exchange-rate-section";
import { SettingsGroup, SettingsRow } from "./components/settings-group";

const APP_VERSION = "1.0.0";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  return (
    <section className="custom-scrollbar bg-background flex flex-1 flex-col overflow-auto">
      <div className="topbar-height bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <BusinessModuleTitle title="Ajustes" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 md:py-10">
        <ExchangeRateSection />

        {isAdmin && <CasheaSettingsSection />}

        <SettingsGroup title="Cuenta">
          <SettingsRow label={user?.fullname || "—"} description={user?.email || "—"}>
            {user?.role && <Badge>{getUserRoleLabel(user.role)}</Badge>}
          </SettingsRow>
        </SettingsGroup>

        <p className="text-muted-foreground text-center text-xs">
          Full Calzado · Versión <span className="tabular-nums">{APP_VERSION}</span> · Anderson R. Román
        </p>
      </div>
    </section>
  );
}
