import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { ExchangeRateSection } from "./components/exchange-rate-section";
import { Settings, User, Globe } from "lucide-react";
import { useActiveBusiness } from "@/features/business/hooks/useBusinessQueries";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const activeBusiness = useActiveBusiness();

  return (
    <section className="custom-scrollbar flex flex-1 flex-col overflow-auto">
      <div className="topbar-height bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <BusinessModuleTitle title="Ajustes" />
      </div>

      <div className="flex flex-col gap-3 border-b px-3 py-3 md:px-4">
        <div className="font-heading text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
          <Settings className="h-3.5 w-3.5" />
          Tasa de Cambio
        </div>
        <ExchangeRateSection />
      </div>

      <div className="grid grid-cols-1 gap-6 border-b px-3 py-3 sm:grid-cols-2 md:px-4">
        <div className="flex flex-col gap-3">
          <div className="font-heading text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <User className="h-3.5 w-3.5" />
            Cuenta
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="border-border/50 flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-xs">Nombre</span>
              <span className="text-sm font-medium">{user?.fullname || "—"}</span>
            </div>
            <div className="border-border/50 flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-xs">Email</span>
              <span className="text-foreground/70 text-sm">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground text-xs">Rol</span>
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold tracking-wider uppercase">
                {user?.role || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="font-heading text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <Globe className="h-3.5 w-3.5" />
            Aplicación
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="border-border/50 flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-xs">Nombre</span>
              <span className="text-sm font-medium">{activeBusiness?.name ?? "—"}</span>
            </div>
            <div className="border-border/50 flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-xs">Versión</span>
              <span className="font-mono text-sm tabular-nums">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground text-xs">Autor</span>
              <span className="text-sm font-medium">Anderson R. Román</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
