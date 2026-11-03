import zapatos from "@/assets/calzado.jpg";

/**
 * Photo side of the login. Purely decorative: the brand lives on the form side,
 * so the photo is shown clean, without text or dark washes over it.
 * On mobile it collapses into a short band above the form.
 */
export function LoginPanel() {
  return (
    <aside className="bg-muted relative h-36 overflow-hidden sm:h-44 md:h-auto" aria-hidden="true">
      <img
        src={zapatos}
        alt=""
        className="animate-in fade-in absolute inset-0 size-full object-cover object-[center_62%] duration-700 ease-out motion-reduce:animate-none md:object-[55%_center]"
      />
    </aside>
  );
}
