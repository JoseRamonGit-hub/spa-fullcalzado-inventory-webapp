import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CasheaOrder } from "@/types";
import { formatCurrencyUSD, formatInteger } from "@/utils/formatters";
import { sumCasheaOrders } from "../cashea-receivables";

type CasheaListFooterProps = {
  /** Órdenes que muestra la tabla, ya filtradas por la búsqueda. */
  orders: readonly CasheaOrder[];
  selectedOrders: readonly CasheaOrder[];
  isLoading: boolean;
  onClearSelection: () => void;
  onRegisterDeposit: () => void;
};

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground/60 px-1.5">
        ·
      </span>
      <span className="text-muted-foreground">{label} </span>
      <span className="data-value text-foreground font-semibold">{children}</span>
    </>
  );
}

/**
 * Pie fijo de la lista: suma lo que se ve y, al seleccionar, se convierte en la barra para Registrar depósito.
 * Mide lo mismo en ambos estados, así que seleccionar no mueve la tabla.
 */
export function CasheaListFooter({
  orders,
  selectedOrders,
  isLoading,
  onClearSelection,
  onRegisterDeposit,
}: CasheaListFooterProps) {
  const isSelecting = selectedOrders.length > 0;
  const totals = sumCasheaOrders(isSelecting ? selectedOrders : orders);
  const noun = isSelecting
    ? totals.count === 1
      ? "orden seleccionada"
      : "órdenes seleccionadas"
    : totals.count === 1
      ? "orden"
      : "órdenes";

  return (
    <footer
      aria-label={isSelecting ? "Órdenes seleccionadas" : "Totales de la lista"}
      className={cn(
        "flex h-10 shrink-0 items-center justify-between gap-3 border-t ps-3 pe-2 text-xs transition-colors md:ps-4 md:text-[13px]",
        isSelecting ? "border-primary/30 bg-primary/8" : "bg-muted/60",
      )}
    >
      {isLoading ? (
        <Skeleton className="h-3.5 w-56 rounded" />
      ) : (
        <p className="min-w-0 truncate" aria-live="polite">
          <span className="font-semibold tabular-nums">{formatInteger(totals.count)}</span> {noun}
          {!isSelecting && totals.count > 0 && (
            <span className="max-md:hidden">
              <Figure label="Monto financiado">{formatCurrencyUSD(totals.financedUsd)}</Figure>
            </span>
          )}
          {totals.count > 0 && <Figure label="Neto esperado">{formatCurrencyUSD(totals.expectedNetUsd)}</Figure>}
        </p>
      )}
      {isSelecting && (
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="max-md:hidden" onClick={onClearSelection}>
            Quitar selección
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Quitar selección"
            onClick={onClearSelection}
          >
            <X aria-hidden="true" />
          </Button>
          <Button size="sm" onClick={onRegisterDeposit}>
            Registrar depósito
          </Button>
        </div>
      )}
    </footer>
  );
}
