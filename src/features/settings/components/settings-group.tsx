import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SettingsGroupProps = {
  title: string;
  icon?: ReactNode;
  /** Control a la derecha del título, p. ej. el candado de un grupo protegido. */
  action?: ReactNode;
  /** Pie de la tarjeta (acciones de guardado). */
  footer?: ReactNode;
  children: ReactNode;
};

/** Grupo de ajustes: título fuera y filas dentro de una tarjeta, como en las preferencias de macOS o Linear. */
export function SettingsGroup({ title, icon, action, footer, children }: SettingsGroupProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <div className="flex min-h-8 items-center justify-between gap-2 px-1">
        <h2 id={titleId} className="font-heading flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="divide-y">{children}</div>
        {footer}
      </div>
    </section>
  );
}

type SettingsRowProps = {
  label: ReactNode;
  description?: ReactNode;
  /** En móvil, pone el control debajo de la etiqueta (para controles anchos). */
  stackOnMobile?: boolean;
  children: ReactNode;
};

export function SettingsRow({ label, description, stackOnMobile = false, children }: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3.5 sm:gap-6",
        stackOnMobile && "flex-col items-stretch gap-3 sm:flex-row sm:items-center",
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-muted-foreground text-xs">{description}</span>}
      </div>
      <div className="flex min-h-9 min-w-0 shrink-0 items-center justify-end">{children}</div>
    </div>
  );
}

export function SettingsGroupFooter({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/50 flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}
