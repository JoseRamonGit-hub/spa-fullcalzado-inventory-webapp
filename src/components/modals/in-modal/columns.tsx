import type { ColumnDef } from "@tanstack/react-table";
import type { ProductInsert } from "@/types/index";
import { formatCurrencyUSD } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

// ── Discriminated union for batch items ──────────────────────
export type NewBatchItem = ProductInsert & {
  _tempId: string;
  _kind: "new";
};

export type ExistingBatchItem = {
  _tempId: string;
  _kind: "existing";
  product_id: string;
  code: string;
  description: string;
  quantity: number;
  currentStock: number;
};

export type BatchItem = NewBatchItem | ExistingBatchItem;

// Legacy alias so existing imports don't break
export type PendingItem = NewBatchItem;

// ── Table meta type ──────────────────────────────────────────
type BatchTableMeta = { onRemoveItem?: (id: string) => void };

export const pendingItemColumns: ColumnDef<BatchItem>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.index + 1}</span>
    ),
    meta: { hideOnMobile: true },
  },
  {
    id: "kind",
    header: "",
    cell: ({ row }) =>
      row.original._kind === "new" ? (
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          Nuevo
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-[10px] px-1 py-0">
          Existente
        </Badge>
      ),
    meta: { hideOnMobile: true },
  },
  {
    id: "code",
    header: "Código",
    cell: ({ row }) => (
      <span className="product-code text-xs">{row.original.code}</span>
    ),
  },
  {
    id: "description",
    header: "Descripción",
    cell: ({ row }) => (
      <span className="block max-w-[140px] md:max-w-[260px] break-words line-clamp-2" title={row.original.description}>
        {row.original.description}
      </span>
    ),
    meta: { hideOnMobile: true },
  },
  {
    id: "price_usd",
    header: () => <span className="block text-right">Precio</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original._kind === "new"
          ? formatCurrencyUSD(row.original.price_usd ?? 0)
          : <span className="text-muted-foreground">—</span>}
      </span>
    ),
  },
  {
    id: "qty",
    header: () => <span className="block text-right">Cant.</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {row.original._kind === "new" ? row.original.stock : row.original.quantity}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as BatchTableMeta | undefined;
      return (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-6 w-6"
          onClick={() => meta?.onRemoveItem?.(row.original._tempId)}
          aria-label={`Eliminar ${row.original.code}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      );
    },
  },
];
