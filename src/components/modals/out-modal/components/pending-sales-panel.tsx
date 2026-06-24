import { PackageOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSale } from "../types";

type PendingSalesPanelProps = {
  pendingSales: PendingSale[];
  onRemovePendingSale: (tempId: string) => void;
};

export function PendingSalesPanel({ pendingSales, onRemovePendingSale }: PendingSalesPanelProps) {
  const pendingSalesCount = pendingSales.length;
  const hasPendingSales = pendingSalesCount > 0;

  return (
    <section className="bg-card -mx-2 flex h-56 min-h-0 flex-col overflow-hidden rounded-md border md:mx-0 md:h-72">
      <header className="bg-muted/35 border-b px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Venta en curso</h3>
          <span className="text-muted-foreground text-xs tabular-nums">
            {hasPendingSales ? `${pendingSalesCount} producto${pendingSalesCount === 1 ? "" : "s"}` : "Sin productos"}
          </span>
        </div>
      </header>

      {hasPendingSales ? (
        <ul className="custom-scrollbar divide-border/60 min-h-0 flex-1 divide-y overflow-auto">
          {pendingSales.map((sale) => (
            <li
              key={sale.tempId}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
            >
              <div className="min-w-0">
                <span className="product-code block uppercase">{sale.code}</span>
                <p className="mt-0.5 truncate text-sm font-medium">{sale.description}</p>
                <p className="text-muted-foreground mt-1 text-xs tabular-nums md:hidden">
                  {sale.quantity} x {formatCurrencyUSD(sale.priceUsd)}
                </p>
              </div>

              <div className="text-muted-foreground hidden text-right text-xs tabular-nums md:block">
                {sale.quantity} x {formatCurrencyUSD(sale.priceUsd)}
              </div>

              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{formatCurrencyUSD(sale.totalUsd)}</p>
                <p className="text-muted-foreground mt-0.5 text-[11px] tabular-nums">
                  {formatCurrencyVES(sale.totalVes)}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive self-start md:self-center"
                onClick={() => onRemovePendingSale(sale.tempId)}
                aria-label={`Eliminar ${sale.code}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <PackageOpen className="size-8 opacity-40" aria-hidden="true" />
          <p className="text-sm">Agrega productos con el buscador para comenzar.</p>
        </div>
      )}
    </section>
  );
}
