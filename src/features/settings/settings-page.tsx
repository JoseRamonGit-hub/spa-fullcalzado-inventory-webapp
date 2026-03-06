import { useAuthStore } from "@/features/auth/store";
import { ExchangeRateSection } from "./components/exchange-rate-section";
import { Settings, User, Globe } from "lucide-react";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="flex flex-col flex-1 overflow-auto custom-scrollbar">
      {/* Page header */}
      <div className="flex topbar-height items-center px-3 md:px-4 bg-background border-b gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="font-semibold text-sm text-foreground whitespace-nowrap">Ajustes</h2>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-2xl">
        {/* User info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            Información del Usuario
          </div>
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Nombre</span>
              <span className="text-sm font-medium">{user?.fullname || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Rol</span>
              <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {user?.role || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Exchange rate module */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Settings className="w-3.5 h-3.5" />
            Tasa de Cambio
          </div>
          <ExchangeRateSection />
        </div>

        {/* App info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            Información de la App
          </div>
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Nombre</span>
              <span className="text-sm font-medium">ShoeStock</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Versión</span>
              <span className="text-sm font-mono tabular-nums">0.1.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Hosting</span>
              <span className="text-sm font-medium">Vercel</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Backend</span>
              <span className="text-sm font-medium">Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
