import { Card, CardContent } from "@/components/ui/card";
import { useLogin } from "./hooks";
import { LoginForm } from "./components/login-form";

export function LoginPage() {
  const { mutate, isPending } = useLogin();

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="border-border/50 overflow-hidden p-0 shadow-xl">
            <CardContent className="grid p-0 md:min-h-[480px] md:grid-cols-2">
              {/* ── Decorative panel (desktop only) ── */}
              <div
                className="bg-sidebar relative hidden flex-col items-start justify-end overflow-hidden p-10 md:flex"
                style={{
                  background: "linear-gradient(160deg, oklch(0.22 0.02 55), oklch(0.16 0.015 55), oklch(0.12 0.01 55))",
                }}
              >
                {/* Grid pattern */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(oklch(1 0 0 / 30%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 30%) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                  }}
                />
                {/* Ambient orbs */}
                <div
                  className="absolute -top-20 right-0 h-80 w-80 rounded-full opacity-20 blur-[90px]"
                  style={{ background: "oklch(0.65 0.16 55)" }}
                />
                <div
                  className="absolute bottom-0 -left-16 h-64 w-64 rounded-full opacity-10 blur-[70px]"
                  style={{ background: "oklch(0.55 0.14 25)" }}
                />

                {/* Branding */}
                <div className="relative z-10 max-w-xs">
                  <h2 className="mb-4 text-3xl leading-[1.1] font-bold tracking-tight text-white/95">
                    Gestión de
                    <br />
                    <span className="text-primary">Inventario</span>
                    <br />
                    Inteligente
                  </h2>
                  <p className="mb-6 text-sm leading-relaxed text-balance text-white/60">
                    Control total de tu stock de calzado: productos, movimientos, ventas y cierres de caja en un solo
                    lugar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Inventario en Tiempo Real", "Registro de Ventas", "Reportes de Caja"].map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Form panel ── */}
              <LoginForm onSubmit={mutate} isPending={isPending} />
            </CardContent>
          </Card>

          <p className="text-muted-foreground/40 text-center text-[11px] font-medium tracking-wider uppercase">
            Full Calzado &copy; {new Date().getFullYear()} — Cuantiva
          </p>
        </div>
      </div>
    </div>
  );
}
