import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { ExchangeRateSection } from "./components/exchange-rate-section";
import { Settings, User, Globe } from "lucide-react";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="custom-scrollbar flex flex-1 flex-col overflow-auto">
      {/* Page header */}
      <div className="topbar-height bg-background sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <div className="flex items-center gap-1.5">
          <span className="bg-primary h-1.5 w-1.5 rounded-full" />
          <h2 className="font-heading text-foreground text-sm font-semibold whitespace-nowrap">Ajustes</h2>
        </div>
      </div>

      {/* Exchange rate section */}
      <div className="space-y-3 border-b px-3 py-3 md:px-4">
        <div className="font-heading text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
          <Settings className="h-3.5 w-3.5" />
          Tasa de Cambio
        </div>
        <ExchangeRateSection />
      </div>

      {/* Info sections */}
      <div className="grid grid-cols-1 gap-6 border-b px-3 py-3 sm:grid-cols-2 md:px-4">
        {/* User info */}
        <div className="space-y-3">
          <div className="font-heading text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <User className="h-3.5 w-3.5" />
            Cuenta
          </div>
          <div className="space-y-2.5">
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

        {/* App info */}
        <div className="space-y-3">
          <div className="font-heading text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <Globe className="h-3.5 w-3.5" />
            Aplicación
          </div>
          <div className="space-y-2.5">
            <div className="border-border/50 flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-xs">Nombre</span>
              <span className="text-sm font-medium">Full Calzado</span>
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
