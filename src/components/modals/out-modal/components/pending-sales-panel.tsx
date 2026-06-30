import { PackageOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
          <Table className="min-w-[42rem] text-xs">
            <TableHeader className="bg-muted/20 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground h-7 w-48 px-2 text-[10px] font-semibold tracking-wider uppercase md:hidden">
                  Producto
                </TableHead>
                <TableHead className="text-muted-foreground hidden h-7 px-2 text-[10px] font-semibold tracking-wider uppercase md:table-cell">
                  Código
                </TableHead>
                <TableHead className="text-muted-foreground hidden h-7 px-2 text-[10px] font-semibold tracking-wider uppercase md:table-cell">
                  Descripción
                </TableHead>
                <TableHead className="text-muted-foreground h-7 px-2 text-right text-[10px] font-semibold tracking-wider uppercase">
                  Cant.
                </TableHead>
                <TableHead className="text-muted-foreground hidden h-7 px-2 text-right text-[10px] font-semibold tracking-wider uppercase md:table-cell">
                  P. Unit.
                </TableHead>
                <TableHead className="text-muted-foreground h-7 px-2 text-right text-[10px] font-semibold tracking-wider uppercase">
                  Total USD
                </TableHead>
                <TableHead className="text-muted-foreground h-7 px-2 text-right text-[10px] font-semibold tracking-wider uppercase">
                  Total Bs.
                </TableHead>
                <TableHead className="text-muted-foreground h-7 px-2 text-right text-[10px] font-semibold tracking-wider uppercase md:hidden">
                  P. Unit.
                </TableHead>
                <TableHead className="h-7 w-8 px-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSales.map((sale) => (
                <TableRow key={sale.tempId} className="hover:bg-muted/25">
                  <TableCell className="max-w-48 px-2 py-1.5 md:hidden">
                    <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                      <span className="product-code shrink-0 uppercase">{sale.code}</span>
                      <span className="truncate font-medium">{sale.description}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden px-2 py-1.5 md:table-cell">
                    <span className="product-code uppercase">{sale.code}</span>
                  </TableCell>
                  <TableCell className="hidden max-w-64 px-2 py-1.5 md:table-cell">
                    <span className="block truncate font-medium">{sale.description}</span>
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-medium tabular-nums">{sale.quantity}</TableCell>
                  <TableCell className="text-muted-foreground hidden px-2 py-1.5 text-right tabular-nums md:table-cell">
                    {formatCurrencyUSD(sale.priceUsd)}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-semibold tabular-nums">
                    {formatCurrencyUSD(sale.totalUsd)}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-2 py-1.5 text-right tabular-nums">
                    {formatCurrencyVES(sale.totalVes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-2 py-1.5 text-right tabular-nums md:hidden">
                    {formatCurrencyUSD(sale.priceUsd)}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemovePendingSale(sale.tempId)}
                      aria-label={`Eliminar ${sale.code}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <PackageOpen className="size-8 opacity-40" aria-hidden="true" />
          <p className="text-sm">Agrega productos con el buscador para comenzar.</p>
        </div>
      )}
    </section>
  );
}
