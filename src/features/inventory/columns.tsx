import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

const columHelper = createColumnHelper<Product>();

const PriceBsCell = ({ priceUsd }: { priceUsd: number }) => {
  const { data: exchangeRate, isLoading } = useExchangeRate();

  if (isLoading) {
    return <div className="text-muted-foreground text-right text-sm">...</div>;
  }

  const rate = exchangeRate?.rate || 0;
  const priceBs = priceUsd * rate;

  return <div className="text-muted-foreground text-right tabular-nums">{formatCurrencyVES(priceBs)}</div>;
};

export const columns = [
  columHelper.accessor("code", {
    header: "Código",
    cell: ({ getValue }) => <span className="product-code font-bold uppercase">{getValue()}</span>,
  }),
  columHelper.accessor("description", {
    header: "Descripción",
    cell: ({ getValue }) => <span className="max-w-table-row block truncate">{getValue()}</span>,
  }),
  columHelper.accessor("stock", {
    header: () => <div className="text-right">Stock</div>,
    cell: ({ getValue }) => (
      <span
        className={`block text-right font-medium tabular-nums ${
          getValue() === 0 ? "text-destructive" : getValue() <= 3 ? "text-warning" : "text-foreground"
        }`}
      >
        {getValue()}
      </span>
    ),
  }),
  columHelper.accessor("price_usd", {
    header: () => <div className="text-right">USD</div>,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyUSD(getValue())}</span>
    ),
  }),
  columHelper.display({
    id: "price_ves",
    header: () => <div className="text-right">VES</div>,
    cell: ({ row }) => {
      return <PriceBsCell priceUsd={row.original.price_usd} />;
    },
  }),
  columHelper.accessor("active", {
    header: () => <div className="text-center">Estado</div>,
    cell: ({ getValue }) => (
      <div className="text-center">
        <Badge variant={getValue() ? "success" : "secondary"}>{getValue() ? "Activo" : "Inactivo"}</Badge>
      </div>
    ),
  }),
  columHelper.display({
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
    meta: { hideOnMobile: true },
    cell: ({ row, table }) => {
      const product = row.original;
      const meta = table.options.meta as { onEdit?: (p: Product) => void; onDelete?: (p: Product) => void } | undefined;
      return (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary h-5 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              meta?.onEdit?.(product);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive h-5 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              meta?.onDelete?.(product);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    },
  }),
] as ColumnDef<Product>[];
