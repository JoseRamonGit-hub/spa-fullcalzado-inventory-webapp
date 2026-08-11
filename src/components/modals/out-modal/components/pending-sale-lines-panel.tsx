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
          <h3 className="text-muted-foreground text-[11px] leading-none font-semibold tracking-[0.05em] uppercase">
            Venta en curso
          </h3>
          <span className="text-muted-foreground text-xs">
            {hasPendingSaleLines
              ? `${pendingSaleLineCount} producto${pendingSaleLineCount === 1 ? "" : "s"}`
              : "Sin productos"}
          </span>
        </div>
      </header>

      {hasPendingSaleLines ? (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
          <Table density="compact" className="min-w-[42rem]" scrollAreaLabel="Productos de la venta en curso">
            <TableHeader className="bg-muted/20 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio unitario USD</TableHead>
                <TableHead className="text-right">Total USD</TableHead>
                <TableHead className="text-right">Total Bs.</TableHead>
                <TableHead className="h-7 w-8 px-1">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSaleLines.map((saleLine) => (
                <TableRow key={saleLine.tempId} className="hover:bg-muted/25">
                  <TableCell>
                    <span className="product-code uppercase">{saleLine.code}</span>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <OverflowTooltip className="font-medium">{saleLine.description}</OverflowTooltip>
                  </TableCell>
                  <TableCell className="tabular-value text-right font-medium">{saleLine.quantity}</TableCell>
                  <TableCell className="data-value text-muted-foreground text-right">
                    {formatCurrencyUSD(saleLine.priceUsd)}
                  </TableCell>
                  <TableCell className="data-value text-right font-semibold">
                    {formatCurrencyUSD(saleLine.totalUsd)}
                  </TableCell>
                  <TableCell className="data-value text-muted-foreground text-right">
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
