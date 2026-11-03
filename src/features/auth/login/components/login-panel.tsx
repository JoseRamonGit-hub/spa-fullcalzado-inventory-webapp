import zapatos from "@/assets/calzado.jpg";

/**
 * Photo side of the login, purely decorative (the brand lives on the form side).
 * The photo sits inset in the card like a framed print, with a soft vignette for
 * depth instead of a heavy dark wash. On mobile it becomes a short band above the form.
 */
export function LoginPanel() {
  return (
    <aside className="bg-card p-2.5 pb-0 md:p-3 md:pr-0" aria-hidden="true">
      {/* Radius = card radius (20px) minus the inset, so the corners stay concentric */}
      <div className="bg-muted relative isolate h-32 overflow-hidden rounded-[10px] sm:h-40 md:h-full md:rounded-lg">
        <img
          src={zapatos}
          alt=""
          className="animate-in fade-in absolute inset-0 -z-10 size-full object-cover object-[center_62%] duration-700 ease-out motion-reduce:animate-none md:object-[55%_center]"
        />
        {/* Soft vignette: darkens the edges a touch so the shoe pops without dimming the photo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,transparent_50%,color-mix(in_oklch,var(--sidebar)_40%,transparent))]" />
        {/* Light warm floor so the bottom edge settles into the card */}
        <div className="from-sidebar/30 absolute inset-0 bg-linear-to-t to-transparent to-40%" />
        {/* Hairline inner edge, like a print mounted in a frame */}
        <div className="absolute inset-0 rounded-[inherit] ring-1 ring-black/10 ring-inset" />
      </div>
    </aside>
  );
}
