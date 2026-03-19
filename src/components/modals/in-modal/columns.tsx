import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrencyUSD } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export type NewBatchItem = {
  _kind: "new";
  _tempId: string;
  code: string;
  description: string;
  priceUsd: number;
  initialStock: number;
};

export type ExistingBatchItem = {
  _kind: "existing";
  _tempId: string;
  productId: string;
  code: string;
  description: string;
  addedQuantity: number;
  currentStock: number;
};

export type BatchItem = NewBatchItem | ExistingBatchItem;

export const pendingItemColumns: ColumnDef<BatchItem>[] = [
  {
    id: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const isNewItem = row.original._kind === "new";
      return isNewItem ? (
        <Badge variant="outline" className="px-1.5 py-0.5 text-[9px] uppercase">
          Nuevo
        </Badge>
      ) : (
        <Badge variant="secondary" className="px-1.5 py-0.5 text-[9px] uppercase">
          +Stock
        </Badge>
      );
    },
    meta: {
      className: "w-[60px] md:w-[80px]",
    },
  },
  {
    accessorKey: "code",
    header: "Código",
    cell: ({ getValue }) => <span className="product-code text-xs uppercase">{getValue<string>()}</span>,
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ getValue }) => <span className="block max-w-40 truncate md:max-w-100">{getValue<string>()}</span>,
    meta: { hideOnMobile: true },
  },
  {
    id: "quantityOrStock",
    header: () => <span className="block text-right">Cant.</span>,
    cell: ({ row }) => {
      const pendingBatchItem = row.original;
      if (pendingBatchItem._kind === "new") {
        return <span className="block text-right font-medium tabular-nums">{pendingBatchItem.initialStock}</span>;
      }
      return (
        <div className="flex items-center justify-end gap-1.5 tabular-nums">
          <span className="text-muted-foreground">{pendingBatchItem.currentStock}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground font-medium">
            {pendingBatchItem.currentStock + pendingBatchItem.addedQuantity}
          </span>
          <span className="text-muted-foreground hidden text-[10px] md:inline-block">
            ({pendingBatchItem.addedQuantity > 0 ? "+" : ""}
            {pendingBatchItem.addedQuantity})
          </span>
        </div>
      );
    },
  },
  {
    id: "priceUsd",
    header: () => <span className="block text-right">Precio</span>,
    cell: ({ row }) => {
      const pendingBatchItem = row.original;
      if (pendingBatchItem._kind === "new") {
        return <span className="block text-right tabular-nums">{formatCurrencyUSD(pendingBatchItem.priceUsd)}</span>;
      }
      return <span className="text-muted-foreground block text-right">—</span>;
    },
    meta: { hideOnMobile: true },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const tableMeta = table.options.meta as { onRemovePendingBatchItem?: (id: string) => void } | undefined;
      return (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-6 w-6"
            onClick={() => tableMeta?.onRemovePendingBatchItem?.(row.original._tempId)}
            aria-label={`Eliminar ${row.original.code}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    },
  },
];
