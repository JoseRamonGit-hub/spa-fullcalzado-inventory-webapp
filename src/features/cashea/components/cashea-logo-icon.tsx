import type { ReactNode } from "react";
import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import { cn } from "@/lib/utils";

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

type CasheaDialogMediaProps = {
  /** Icono de la acción (anular, asociar…) en el distintivo sobre la esquina del logo. */
  badgeIcon: ReactNode;
  badgeClassName: string;
};

/** Logo Cashea del encabezado de un diálogo, con el distintivo de la acción. */
export function CasheaDialogMedia({ badgeIcon, badgeClassName }: CasheaDialogMediaProps) {
  return (
    <span className="relative shrink-0">
      {/* Solo sombra: un aro o filo sobre el amarillo lo ensucia y lo hace ver como pegatina. */}
      <CasheaLogoIcon className="size-10 rounded-lg shadow-sm" />
      <span
        className={cn(
          "ring-background absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full ring-2 [&_svg]:size-3",
          badgeClassName,
        )}
      >
        {badgeIcon}
      </span>
    </span>
  );
}
