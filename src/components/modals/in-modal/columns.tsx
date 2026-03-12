import type { ColumnDef } from "@tanstack/react-table";
import type { ProductInsert } from "@/types/index";
import { formatCurrencyUSD } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export type PendingItem = ProductInsert & { _tempId: string };

export const pendingItemColumns: ColumnDef<PendingItem>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.index + 1}</span>
    ),
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "code",
    header: "Código",
    cell: ({ getValue }) => (
      <span className="product-code text-xs">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ getValue }) => (
      <span className="block max-w-[180px] truncate md:max-w-[280px]">
        {getValue<string>()}
      </span>
    ),
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "price_usd",
    header: () => <span className="text-right block">Precio</span>,
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">
        {formatCurrencyUSD(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "stock",
    header: () => <span className="text-right block">Stock</span>,
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">{getValue<number>()}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onRemoveItem?: (id: string) => void } | undefined;
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
