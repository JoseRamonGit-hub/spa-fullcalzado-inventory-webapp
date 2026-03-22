import zapatos from "@/assets/calzado.jpg";

export function LoginPanel() {
  return (
    <aside className="relative hidden flex-col items-start justify-end overflow-hidden bg-black p-10 md:flex">
      {/* Background photo */}
      <img
        src={zapatos}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Overlay: dark gradient from bottom so text stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, oklch(0.10 0.01 50 / 0.92) 0%, oklch(0.12 0.01 50 / 0.50) 40%, oklch(0.14 0.01 50 / 0.20) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Branding */}
      <div className="relative z-10 flex h-full w-full flex-col justify-between">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-white/30 uppercase">
          Sistema Interno
        </span>

        <div className="max-w-xs">
          <h2 className="font-heading mb-3 text-3xl leading-[1.1] font-bold tracking-tight text-white/95">
            Full Calzados
            <br />
            <span className="text-primary">C.A</span>
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-balance text-white/50">
            Panel de gestión de inventario, ventas y cierres de caja para tu equipo.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-white/30">
            <span>Inventario</span>
            <span className="text-white/15">·</span>
            <span>Ventas</span>
            <span className="text-white/15">·</span>
            <span>Caja</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
