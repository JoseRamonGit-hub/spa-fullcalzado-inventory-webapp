import { PackageOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import type { PendingSaleLine } from "../types";

type PendingSaleLinesPanelProps = {
  pendingSaleLines: PendingSaleLine[];
  onRemovePendingSaleLine: (tempId: string) => void;
};

export function PendingSaleLinesPanel({ pendingSaleLines, onRemovePendingSaleLine }: PendingSaleLinesPanelProps) {
  const pendingSaleLineCount = pendingSaleLines.length;
  const hasPendingSaleLines = pendingSaleLineCount > 0;

  return (
    <section
      className="bg-card -mx-2 flex h-56 min-h-0 flex-col overflow-hidden rounded-md border md:mx-0 md:h-72"
      aria-label="Renglones de venta pendientes"
    >
      <header className="bg-muted/35 border-b px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-muted-foreground text-[10px] font-semibold uppercase">Venta en curso</h3>
          <span className="text-muted-foreground text-xs tabular-nums">
            {hasPendingSaleLines
              ? `${pendingSaleLineCount} producto${pendingSaleLineCount === 1 ? "" : "s"}`
              : "Sin productos"}
          </span>
        </div>
      </header>

      {hasPendingSaleLines ? (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
          <Table className="min-w-[42rem] text-xs" scrollAreaLabel="Productos de la venta en curso">
            <TableHeader className="bg-muted/20 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-2">Código</TableHead>
                <TableHead className="px-2">Descripción</TableHead>
                <TableHead className="px-2 text-right">Cantidad</TableHead>
                <TableHead className="px-2 text-right">Precio unitario USD</TableHead>
                <TableHead className="px-2 text-right">Total USD</TableHead>
                <TableHead className="px-2 text-right">Total Bs.</TableHead>
                <TableHead className="h-7 w-8 px-1">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSaleLines.map((saleLine) => (
                <TableRow key={saleLine.tempId} className="hover:bg-muted/25">
                  <TableCell className="px-2 py-1.5">
                    <span className="product-code uppercase">{saleLine.code}</span>
                  </TableCell>
                  <TableCell className="max-w-64 px-2 py-1.5">
                    <OverflowTooltip className="font-medium">{saleLine.description}</OverflowTooltip>
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-medium tabular-nums">{saleLine.quantity}</TableCell>
                  <TableCell className="text-muted-foreground px-2 py-1.5 text-right tabular-nums">
                    {formatCurrencyUSD(saleLine.priceUsd)}
                  </TableCell>
                  <TableCell className="px-2 py-1.5 text-right font-semibold tabular-nums">
                    {formatCurrencyUSD(saleLine.totalUsd)}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-2 py-1.5 text-right tabular-nums">
                    {formatCurrencyVES(saleLine.totalVes)}
                  </TableCell>
                  <TableCell className="px-1 py-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemovePendingSaleLine(saleLine.tempId)}
                      aria-label={`Eliminar ${saleLine.code}`}
                    >
                      <Trash2 data-icon="inline-start" aria-hidden="true" />
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
