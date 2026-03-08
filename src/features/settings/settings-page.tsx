import { useAuthStore } from "@/features/auth/store";
import { ExchangeRateSection } from "./components/exchange-rate-section";
import { Settings, User, Globe } from "lucide-react";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="custom-scrollbar flex flex-1 flex-col overflow-auto">
      {/* Page header */}
      <div className="topbar-height bg-background flex items-center gap-2 border-b px-3 md:px-4">
        <div className="flex items-center gap-1.5">
          <span className="bg-primary h-1.5 w-1.5 rounded-full" />
          <h2 className="text-foreground text-sm font-semibold whitespace-nowrap">Ajustes</h2>
        </div>
      </div>

      <div className="max-w-5xl space-y-6 p-4 md:p-6">
        {/* Grid layout for desktop */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* User info — flat design */}
          <div className="space-y-3">
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <User className="h-3.5 w-3.5" />
              Información del Usuario
            </div>
            <div className="space-y-2.5">
              <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                <span className="text-muted-foreground text-xs">Nombre</span>
                <span className="text-sm font-medium">{user?.fullname || "—"}</span>
              </div>
              <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                <span className="text-muted-foreground text-xs">Email</span>
                <span className="text-sm font-medium">{user?.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground text-xs">Rol</span>
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold tracking-wider uppercase">
                  {user?.role || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* App info — flat design */}
          <div className="space-y-3">
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Globe className="h-3.5 w-3.5" />
              Información de la App
            </div>
            <div className="space-y-2.5">
              <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                <span className="text-muted-foreground text-xs">Nombre</span>
                <span className="text-sm font-medium">Full Calzado</span>
              </div>
              <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                <span className="text-muted-foreground text-xs">Versión</span>
                <span className="font-mono text-sm tabular-nums">0.1.0</span>
              </div>
              <div className="border-border/50 flex items-center justify-between border-b py-1.5">
                <span className="text-muted-foreground text-xs">Hosting</span>
                <span className="text-sm font-medium">Vercel</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground text-xs">Backend</span>
                <span className="text-sm font-medium">Supabase</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange rate module — full width */}
        <div className="space-y-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <Settings className="h-3.5 w-3.5" />
            Tasa de Cambio
          </div>
          <ExchangeRateSection />
        </div>
      </div>
    </section>
  );
}
