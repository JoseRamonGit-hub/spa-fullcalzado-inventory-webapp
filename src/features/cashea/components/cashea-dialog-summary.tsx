import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CasheaDialogSummaryRow = {
  label: string;
  value: ReactNode;
  /**
   * La cifra que importa en este diálogo: rótulo y valor con peso, nunca más grandes, y un respiro encima para que se
   * lea como el resultado de las filas anteriores.
   */
  isKey?: boolean;
};

type CasheaDialogSummaryProps = {
  label: string;
  rows: CasheaDialogSummaryRow[];
};

/**
 * Datos de solo lectura al inicio de un diálogo Cashea: filas planas con el rótulo a la izquierda y el valor a la
 * derecha, separadas del formulario por una raya.
 */
export function CasheaDialogSummary({ label, rows }: CasheaDialogSummaryProps) {
  return (
    <dl aria-label={label} className="flex flex-col gap-1 border-b pb-3 text-sm">
      {rows.map((row, index) => (
        // Cada fila reparte su propio ancho: un valor largo (factura · fecha) no obliga a partir los rótulos de otras.
        <div key={index} className={cn("flex items-baseline justify-between gap-4", row.isKey && "mt-1")}>
          <dt className={cn("text-muted-foreground", row.isKey && "text-foreground font-medium")}>{row.label}</dt>
          <dd className={cn("data-value text-right", row.isKey && "font-semibold")}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
