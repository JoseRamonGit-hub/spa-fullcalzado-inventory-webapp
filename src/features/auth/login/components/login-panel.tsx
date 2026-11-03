import zapatos from "@/assets/calzado.jpg";

/**
 * Photo side of the login. The brand lockup lives on the form side; the photo
 * carries the mood: a warm dark wash from the bottom and quiet lettering on top.
 * On mobile it collapses into a short band above the form.
 */
export function LoginPanel() {
  return (
    <aside className="bg-sidebar relative isolate flex h-36 flex-col justify-end overflow-hidden p-6 sm:h-44 md:h-auto md:justify-between md:p-10">
      <img
        src={zapatos}
        alt=""
        aria-hidden="true"
        className="animate-in fade-in absolute inset-0 -z-10 size-full object-cover object-[center_62%] duration-700 ease-out motion-reduce:animate-none md:object-[55%_center]"
      />
      {/* Warm dark wash from the bottom: gives the photo depth and keeps the lettering readable */}
      <div
        className="from-sidebar/90 via-sidebar/45 to-sidebar/15 absolute inset-0 -z-10 bg-linear-to-t"
        aria-hidden="true"
      />

      <span className="text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase">Sistema interno</span>

      <div className="hidden max-w-sm md:block">
        <p className="font-heading text-2xl leading-snug font-semibold tracking-tight text-balance text-white">
          Inventario, ventas y cierres de caja de tus zapaterías en un solo lugar.
        </p>
        <p className="mt-4 flex items-center gap-2 text-xs text-white/70">
          <span>Inventario</span>
          <span aria-hidden="true">·</span>
          <span>Ventas</span>
          <span aria-hidden="true">·</span>
          <span>Caja</span>
        </p>
      </div>
    </aside>
  );
}
