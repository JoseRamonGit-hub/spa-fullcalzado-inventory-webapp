import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CasheaOrder } from "@/types";
import { formatCalendarDateString } from "@/utils/formatters";

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
  className?: string;
};

/**
 * Datos de solo lectura de un diálogo Cashea: filas planas con el rótulo a la izquierda y el valor a la derecha,
 * separadas del formulario por una raya.
 */
export function CasheaDialogSummary({ label, rows, className }: CasheaDialogSummaryProps) {
  return (
    <dl aria-label={label} className={cn("divide-border/60 divide-y border-y text-sm", className)}>
      {rows.map((row, index) => (
        // Cada fila reparte su propio ancho: un valor largo (factura · fecha) no obliga a partir los rótulos de otras.
        <div
          key={index}
          className={cn("flex min-h-8 items-baseline justify-between gap-3 px-3 py-1.5", row.isKey && "bg-muted/50")}
        >
          <dt className={cn("text-muted-foreground", row.isKey && "text-foreground font-medium")}>{row.label}</dt>
          <dd className={cn("data-value min-w-0 text-right [overflow-wrap:anywhere]", row.isKey && "font-semibold")}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CasheaOrderInvoice({ order }: { order: Pick<CasheaOrder, "invoice_number" | "sale_date"> }) {
  return (
    <>
      {order.invoice_number}
      <span className="text-muted-foreground"> · {formatCalendarDateString(order.sale_date)}</span>
    </>
  );
}
