import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLogin } from "./hooks";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useAppForm } from "@/hooks/form";

export function LoginPage() {
  const { mutate, isPending } = useLogin();

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      mutate(value);
    },
  });

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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="bg-card relative flex flex-col justify-center p-6 md:p-10"
              >
                <div className="flex flex-col gap-8">
                  {/* Header */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div
                      className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.60 0.16 55), oklch(0.50 0.14 55))",
                      }}
                    >
                      <ShoppingBag className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-foreground text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Ingresa tus credenciales para acceder al sistema
                    </p>
                  </div>

                  <div className="grid gap-5">
                    {/* Email */}
                    <form.AppField
                      name="email"
                      validators={{
                        onChange: ({ value }) => {
                          if (!value) return "El correo es requerido";
                          if (!/^\S+@\S+\.\S+$/.test(value)) return "Correo electrónico inválido";
                          return undefined;
                        },
                      }}
                    >
                      {(field) => (
                        <field.TextField
                          label="Correo Electrónico"
                          type="email"
                          placeholder="admin@fullcalzado.com"
                          autoComplete="email"
                        />
                      )}
                    </form.AppField>

                    {/* Password */}
                    <form.AppField
                      name="password"
                      validators={{
                        onChange: ({ value }) => (!value ? "La contraseña es requerida" : undefined),
                      }}
                    >
                      {(field) => (
                        <field.TextFieldGroup
                          label="Contraseña"
                          type="password"
                          placeholder="••••••••"
                          passwordEye={true}
                          autoComplete="current-password"
                        />
                      )}
                    </form.AppField>
                  </div>

                  {/* Submit */}
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        className="group mt-2 h-12 w-full gap-2 text-sm font-semibold transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]"
                        disabled={!canSubmit || isPending || isSubmitting}
                      >
                        {isPending || isSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Iniciando...
                          </span>
                        ) : (
                          <>
                            Entrar al panel
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>
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
