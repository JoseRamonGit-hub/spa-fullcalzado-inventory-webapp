import zapatos from "@/assets/calzado.jpg";

/**
 * Brand side of the login. On desktop it is the left column; on mobile it
 * collapses into a photo band above the form so the brand survives small screens.
 */
export function LoginPanel() {
  return (
    <aside className="bg-sidebar relative isolate flex h-40 flex-col justify-end overflow-hidden p-6 sm:h-48 md:h-auto md:justify-between md:p-10">
      <img
        src={zapatos}
        alt=""
        aria-hidden="true"
        className="animate-in fade-in zoom-in-105 absolute inset-0 -z-10 size-full object-cover object-[center_55%] duration-1000 ease-out motion-reduce:animate-none md:object-[center_40%]"
      />
      {/* Warm dark wash from the bottom keeps the wordmark readable over the photo */}
      <div
        className="from-sidebar/95 via-sidebar/40 md:from-sidebar md:to-sidebar/5 absolute inset-0 -z-10 bg-linear-to-t to-transparent"
        aria-hidden="true"
      />

      <img
        src="/favicon-96x96.png"
        alt=""
        aria-hidden="true"
        className="hidden size-11 rounded-xl shadow-lg shadow-black/30 md:block"
      />

      <div className="flex items-center gap-3 md:block md:max-w-xs">
        <img
          src="/favicon-96x96.png"
          alt=""
          aria-hidden="true"
          className="size-9 rounded-lg shadow-md shadow-black/30 md:hidden"
        />
        <div>
          <p className="font-heading text-2xl leading-none font-bold tracking-tight text-white md:text-4xl md:leading-[1.05]">
            Full Calzado
          </p>
          <p className="mt-1.5 text-sm text-white/80 md:mt-4 md:text-base md:leading-relaxed md:text-balance">
            <span className="md:hidden">Gestión de tus zapaterías</span>
            <span className="hidden md:inline">
              Inventario, ventas y cierres de caja de tus zapaterías en un solo lugar.
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
