import type { ColumnDef } from "@tanstack/react-table";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export type PendingSale = {
  _tempId: string;
  productId: string;
  code: string;
  description: string;
  quantity: number;
  priceUsd: number;
  priceVes: number;
  totalUsd: number;
  totalVes: number;
  maxStock: number;
};

export const pendingSaleColumns: ColumnDef<PendingSale>[] = [
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
      <span className="block max-w-[160px] truncate md:max-w-[240px]">
        {getValue<string>()}
      </span>
    ),
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "quantity",
    header: () => <span className="block text-right">Cant.</span>,
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: "priceUsd",
    header: () => <span className="block text-right">P. Unit.</span>,
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">
        {formatCurrencyUSD(getValue<number>())}
      </span>
    ),
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: "totalUsd",
    header: () => <span className="block text-right">Total USD</span>,
    cell: ({ getValue }) => (
      <span className="text-foreground block text-right font-semibold tabular-nums">
        {formatCurrencyUSD(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "totalVes",
    header: () => <span className="block text-right">Total Bs</span>,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground block text-right tabular-nums">
        {formatCurrencyVES(getValue<number>())}
      </span>
    ),
    meta: { hideOnMobile: true },
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
