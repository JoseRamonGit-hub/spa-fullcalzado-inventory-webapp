import { SportShoe } from "lucide-react";

/** Brand lockup: the app mark (same shape as the favicon) next to the product name. */
export function LoginBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg shadow-xs"
        aria-hidden="true"
      >
        <SportShoe className="size-4.5" />
      </span>
      <span className="font-heading text-foreground text-base font-bold tracking-tight">Full Calzado</span>
    </div>
  );
}

export function HeaderLoginForm() {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-heading text-foreground text-2xl leading-tight font-bold tracking-tight md:text-3xl">
        Inicia tu jornada
      </h1>
      <p className="text-muted-foreground text-sm text-pretty">
        Entra con el correo y la contraseña que te asignó el administrador.
      </p>
    </header>
  );
}
