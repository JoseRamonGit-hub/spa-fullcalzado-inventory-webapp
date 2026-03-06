import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "./hooks";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";

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
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden items-center justify-center"
        style={{
          background: "linear-gradient(135deg, oklch(0.35 0.15 270), oklch(0.25 0.12 280), oklch(0.20 0.08 260))",
        }}
      >
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Gradient orbs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "oklch(0.55 0.25 270)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.50 0.20 300)" }}
        />
        {/* Branding */}
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-8 border border-white/10">
            <ShoppingBag className="w-10 h-10 text-white/90" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight mb-4">ShoeStock</h1>
          <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
            Gestión de inventario inteligente para tu negocio de calzado
          </p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 border border-primary/20"
              style={{
                background: "linear-gradient(135deg, oklch(0.55 0.2 270 / 15%), oklch(0.55 0.2 270 / 5%))",
              }}
            >
              <ShoppingBag className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">ShoeStock</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Iniciar Sesión</h2>
            <p className="text-sm text-muted-foreground mt-1.5">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Correo Electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-10 w-10 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 font-semibold" disabled={isPending}>
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground/60 mt-10">
            ShoeStock &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
