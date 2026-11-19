import type { ReactNode } from "react";
import casheaLogo from "@/assets/cashea_logos/cashea_logo_512x512.webp";
import casheaHorizontalLogo from "@/assets/cashea_logos/cashea_logo_horizontal_normal_version.png";
import { cn } from "@/lib/utils";

const HORIZONTAL_LOGO_MASK = { maskImage: `url(${casheaHorizontalLogo})`, maskSize: "100% 100%" };

export function CasheaHorizontalLogo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Cashea"
      className={cn("relative inline-block aspect-[1107/275] h-6 shrink-0", className)}
    >
      <img src={casheaHorizontalLogo} alt="" className="size-full" />
      {/* El texto del logo es negro; en oscuro se repinta con el foreground para que se lea, sin tocar el ícono amarillo. */}
      <span
        aria-hidden="true"
        className="bg-foreground absolute inset-0 hidden [clip-path:inset(0_0_0_26%)] dark:block"
        style={HORIZONTAL_LOGO_MASK}
      />
    </span>
  );
}

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

const BADGED_LOGO_SIZES = {
  dialog: {
    root: "",
    logo: "size-10 rounded-lg shadow-sm",
    badge: "-right-1 -bottom-1 size-4.5 ring-2 [&_svg]:size-3",
  },
};

type CasheaBadgedLogoProps = {
  /** Icono de la acción o estado en el distintivo sobre la esquina del logo. */
  badgeIcon?: ReactNode;
  badgeClassName?: string;
  logoClassName?: string;
  size?: keyof typeof BADGED_LOGO_SIZES;
};

export function CasheaBadgedLogo({ badgeIcon, badgeClassName, logoClassName, size = "dialog" }: CasheaBadgedLogoProps) {
  const sizeClasses = BADGED_LOGO_SIZES[size];

  return (
    <span className={cn("relative shrink-0", sizeClasses.root)}>
      {/* Solo sombra: un aro o filo sobre el amarillo lo ensucia y lo hace ver como pegatina. */}
      <CasheaLogoIcon className={cn(sizeClasses.logo, logoClassName)} />
      {badgeIcon && (
        <span
          className={cn(
            "ring-background absolute flex items-center justify-center rounded-full",
            sizeClasses.badge,
            badgeClassName,
          )}
        >
          {badgeIcon}
        </span>
      )}
    </span>
  );
}
