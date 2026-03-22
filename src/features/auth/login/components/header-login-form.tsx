import { ShoppingBag } from "lucide-react";

export function HeaderLoginForm() {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <div
        className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5"
        style={{
          background: "linear-gradient(135deg, oklch(0.60 0.16 55), oklch(0.50 0.14 55))",
        }}
        aria-hidden="true"
      >
        <ShoppingBag className="h-7 w-7 text-white" />
      </div>
      <h1 className="font-heading text-foreground text-2xl font-bold tracking-tight">Bienvenido de nuevo</h1>
      <p className="text-muted-foreground text-sm text-balance">Ingresa tus credenciales para acceder al sistema</p>
    </header>
  );
}
