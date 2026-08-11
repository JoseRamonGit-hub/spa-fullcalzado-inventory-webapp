import { PackageOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD } from "@/utils/formatters";
import type { BatchItem } from "../types";

type PendingBatchPanelProps = {
  pendingBatchItems: BatchItem[];
  onRemovePendingBatchItem: (tempId: string) => void;
};

function BatchActionBadge({ item }: { item: BatchItem }) {
  return item.kind === "new" ? (
    <Badge variant="outline" className="px-1.5 py-0.5 text-[11px] uppercase">
      Nuevo
    </Badge>
  ) : (
    <Badge variant="outline" className="px-1.5 py-0.5 text-[11px] uppercase" title="Reposición de inventario">
      Reposición
    </Badge>
  );
}

function BatchQuantity({ item }: { item: BatchItem }) {
  if (item.kind === "new") {
    return <span className="data-value font-medium">{item.initialStock}</span>;
  }

  return (
    <span className="data-value">
      <span className="text-muted-foreground">{item.currentStock}</span>
      <span className="text-muted-foreground mx-1">→</span>
      <span className="font-medium">{item.currentStock + item.addedQuantity}</span>
      <span className="text-muted-foreground ml-1 text-[11px]">(+{item.addedQuantity})</span>
    </span>
  );
}

function BatchPrice({ item }: { item: BatchItem }) {
  if (item.kind === "new") {
    return <p className="data-value text-muted-foreground text-xs">{formatCurrencyUSD(item.priceUsd)}</p>;
  }

  if (item.priceUsd != null && item.originalPriceUsd != null && item.priceUsd !== item.originalPriceUsd) {
    return (
      <p className="data-value text-muted-foreground text-xs">
        <span className="line-through">{formatCurrencyUSD(item.originalPriceUsd)}</span>
        <span className="mx-1">→</span>
        <span className="text-foreground font-medium">{formatCurrencyUSD(item.priceUsd)}</span>
      </p>
    );
  }

  return <p className="text-muted-foreground text-xs">Precio sin cambio</p>;
}

export function PendingBatchPanel({ pendingBatchItems, onRemovePendingBatchItem }: PendingBatchPanelProps) {
  const pendingBatchItemsCount = pendingBatchItems.length;
  const hasPendingBatchItems = pendingBatchItemsCount > 0;

  return (
    <section className="bg-card -mx-2 flex h-56 min-h-0 flex-col overflow-hidden rounded-md border md:mx-0 md:h-72">
      <header className="bg-muted/35 border-b px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-muted-foreground text-[11px] leading-none font-semibold tracking-[0.05em] uppercase">
            Lote de carga
          </h3>
          <span className="text-muted-foreground text-xs">
            {hasPendingBatchItems
              ? `${pendingBatchItemsCount} producto${pendingBatchItemsCount === 1 ? "" : "s"}`
              : "Sin productos"}
          </span>
        </div>
      </header>

      {hasPendingBatchItems ? (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
          <Table density="compact" className="min-w-[40rem]" scrollAreaLabel="Productos del lote de carga">
            <TableHeader className="bg-muted/20 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">Acción</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-28 text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio USD</TableHead>
                <TableHead className="h-7 w-8 px-1">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBatchItems.map((item) => (
                <TableRow key={item.tempId} className="hover:bg-muted/25">
                  <TableCell>
                    <BatchActionBadge item={item} />
                  </TableCell>
                  <TableCell>
                    <span className="product-code uppercase">{item.code}</span>
                  </TableCell>
                  <TableCell className="max-w-72">
                    <OverflowTooltip className="font-medium">{item.description}</OverflowTooltip>
                  </TableCell>
                  <TableCell className="text-right">
                    <BatchQuantity item={item} />
                  </TableCell>
                  <TableCell className="text-right">
                    <BatchPrice item={item} />
                  </TableCell>
                  <TableCell className="px-1 py-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemovePendingBatchItem(item.tempId)}
                      aria-label={`Eliminar ${item.code}`}
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
          <p className="text-sm">Busca un producto o escribe un código nuevo para comenzar.</p>
        </div>
      )}
    </section>
  );
}
