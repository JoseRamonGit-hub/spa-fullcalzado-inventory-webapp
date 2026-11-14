import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import { cn } from "@/lib/utils";

/** Logo de Cashea con el tamaño de un icono de navegación; decorativo, la etiqueta la pone quien lo usa. */
export function CasheaLogoIcon({ className }: { className?: string }) {
  return (
    <img
      src={casheaLogo}
      alt=""
      aria-hidden="true"
      className={cn("size-4 shrink-0 rounded-sm object-contain", className)}
    />
  );
}
