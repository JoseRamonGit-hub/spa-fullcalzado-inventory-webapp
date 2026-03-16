export function LoginPanel() {
  return (
    <aside
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
        aria-hidden="true"
      />
      {/* Ambient orbs */}
      <div
        className="absolute -top-20 right-0 h-80 w-80 rounded-full opacity-20 blur-[90px]"
        style={{ background: "oklch(0.65 0.16 55)" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 -left-16 h-64 w-64 rounded-full opacity-10 blur-[70px]"
        style={{ background: "oklch(0.55 0.14 25)" }}
        aria-hidden="true"
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
          Control total de tu stock de calzado: productos, movimientos, ventas y cierres de caja en un solo lugar.
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Características clave">
          {["Inventario en Tiempo Real", "Registro de Ventas", "Reportes de Caja"].map((f) => (
            <li
              key={f}
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm"
            >
              {f}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
