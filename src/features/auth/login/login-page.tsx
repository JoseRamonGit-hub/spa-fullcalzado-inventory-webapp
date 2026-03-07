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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2 md:min-h-[480px]">
              {/* ── Decorative panel (desktop only) ── */}
              <div
                className="relative hidden md:flex flex-col items-start justify-end p-10 overflow-hidden"
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
                  className="absolute -top-20 right-0 w-80 h-80 rounded-full opacity-20 blur-[90px]"
                  style={{ background: "oklch(0.65 0.16 55)" }}
                />
                <div
                  className="absolute bottom-0 -left-16 w-64 h-64 rounded-full opacity-10 blur-[70px]"
                  style={{ background: "oklch(0.55 0.14 25)" }}
                />

                {/* Branding */}
                <div className="relative z-10 max-w-xs">
                  <h2 className="text-3xl font-bold text-white tracking-tight leading-[1.1] mb-4">
                    Gestión de
                    <br />
                    <span style={{ color: "oklch(0.75 0.14 55)" }}>Inventario</span>
                    <br />
                    Inteligente
                  </h2>
                  <p className="text-sm text-white/50 leading-relaxed mb-6">
                    Control total de tu stock de calzado: productos, movimientos, ventas y cierres de caja en un solo
                    lugar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Inventario en Tiempo Real", "Registro de Ventas", "Reportes de Caja"].map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-white/10 text-white/60 bg-white/5"
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
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-1"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
                      }}
                    >
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Bienvenido</h1>
                    <p className="text-balance text-sm text-muted-foreground">
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
                        className="h-10 pr-11 bg-white"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-10 w-11 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-r-md"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button type="submit" className="w-full h-10 font-semibold text-sm gap-2" disabled={isPending}>
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Iniciando...
                      </span>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-[10px] text-muted-foreground/50">
            Full Calzado &copy; {new Date().getFullYear()} — Cuantiva
          </p>
        </div>
      </div>
    </div>
  );
}
