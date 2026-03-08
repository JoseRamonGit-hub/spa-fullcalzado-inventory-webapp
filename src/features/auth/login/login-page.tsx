import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "./hooks";
import { ShoppingBag, Eye, EyeOff, ArrowRight } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ email, password });
  };

  return (
    <div className="bg-muted flex min-h-dvh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:min-h-[480px] md:grid-cols-2">
              {/* ── Decorative panel (desktop only) ── */}
              <div
                className="relative hidden flex-col items-start justify-end overflow-hidden p-10 md:flex"
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
                  <h2 className="mb-4 text-3xl leading-[1.1] font-bold tracking-tight text-white">
                    Gestión de
                    <br />
                    <span style={{ color: "oklch(0.75 0.14 55)" }}>Inventario</span>
                    <br />
                    Inteligente
                  </h2>
                  <p className="mb-6 text-sm leading-relaxed text-white/50">
                    Control total de tu stock de calzado: productos, movimientos, ventas y cierres de caja en un solo
                    lugar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Inventario en Tiempo Real", "Registro de Ventas", "Reportes de Caja"].map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Form panel ── */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div
                      className="mb-1 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
                      }}
                    >
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Bienvenido</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Ingresa tus credenciales para acceder al sistema
                    </p>
                  </div>

                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 bg-white"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-10 bg-white pr-11"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground absolute top-0 right-0 inline-flex h-10 w-11 items-center justify-center rounded-r-md transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="h-10 w-full gap-2 text-sm font-semibold" disabled={isPending}>
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Iniciando...
                      </span>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-muted-foreground/50 text-center text-[10px]">
            Full Calzado &copy; {new Date().getFullYear()} — Cuantiva
          </p>
        </div>
      </div>
    </div>
  );
}
