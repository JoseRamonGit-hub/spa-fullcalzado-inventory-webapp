import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "./hooks";
import { ShoppingBag, Eye, EyeOff, ArrowRight } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { mutate, isPending } = useLogin();

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    mutate(
      { email, password },
      {
        onSuccess: (result) => {
          if (result.success) {
            navigate({ to: "/inventory" });
          }
        },
      },
    );
  };

  return (
    <div className="relative flex min-h-dvh">
      {/* ── Decorative panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden items-end justify-start"
        style={{
          background: "linear-gradient(160deg, oklch(0.22 0.02 55), oklch(0.16 0.015 55), oklch(0.12 0.01 55))",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 30%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 30%) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Warm gradient orbs */}
        <div
          className="absolute -top-24 right-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "oklch(0.65 0.16 55)" }}
        />
        <div
          className="absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
          style={{ background: "oklch(0.55 0.14 25)" }}
        />

        {/* Branding content */}
        <div className="relative z-10 p-12 xl:p-16 max-w-lg">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 border border-white/10"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
            }}
          >
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
            Gestión de
            <br />
            <span style={{ color: "oklch(0.75 0.14 55)" }}>Inventario</span>
            <br />
            Inteligente
          </h1>

          <p className="text-base text-white/50 max-w-sm leading-relaxed mt-6">
            Control total de tu stock de calzado: productos, movimientos, ventas y cierres de caja en un solo lugar.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {["Inventario en Tiempo Real", "Registro de Ventas", "Reportes de Caja"].map((f) => (
              <span
                key={f}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 text-white/60 bg-white/5"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-card">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.16 55), oklch(0.52 0.14 55))",
              }}
            >
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Full Calzado</h1>
            <p className="text-xs text-muted-foreground mt-1">Gestión de Inventario</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Bienvenido</h2>
            <p className="text-sm text-muted-foreground mt-2">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Correo Electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-card"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-11 bg-card"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-11 w-11 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-r-md"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-semibold text-sm gap-2" disabled={isPending}>
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
          </form>

          <div className="mt-10 pt-6 border-t border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Acceso Demo</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@cuantiva.com");
                  setPassword("admin");
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/60 bg-background hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary text-[11px] font-bold">
                    A
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">Admin</p>
                    <p className="text-[10px] text-muted-foreground">admin@cuantiva.com</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("employee@cuantiva.com");
                  setPassword("employee");
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/60 bg-background hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground text-[11px] font-bold">
                    E
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">Employee</p>
                    <p className="text-[10px] text-muted-foreground">employee@cuantiva.com</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50 mt-8">
            Full Calzado &copy; {new Date().getFullYear()} — Cuantiva
          </p>
        </div>
      </div>
    </div>
  );
}
