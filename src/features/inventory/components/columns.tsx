import type { ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExchangeRate } from "@/features/exchange_rates/hooks";
import { Pencil, Trash2 } from "lucide-react";

const PriceBsCell = ({ priceUsd }: { priceUsd: number }) => {
  const { data: exchangeRate, isLoading } = useExchangeRate();

  if (isLoading) {
    return <div className="text-right text-muted-foreground text-sm">...</div>;
  }

  const rate = exchangeRate?.rate || 0;
  const priceBs = priceUsd * rate;

  const formatted = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceBs);

  return <div className="text-right tabular-nums text-muted-foreground">Bs {formatted}</div>;
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "code",
    header: "Código",
    cell: ({ row }) => <span className="product-code font-medium">{row.getValue("code")}</span>,
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => <span className="truncate max-w-[200px] inline-block">{row.getValue("description")}</span>,
  },
  {
    accessorKey: "stock",
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <div className="text-right tabular-nums font-medium">
          <span className={stock === 0 ? "text-destructive" : stock <= 3 ? "text-warning" : "text-foreground"}>
            {stock}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "price_usd",
    header: () => <div className="text-right">USD</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price_usd"));
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
      return <div className="text-right font-medium tabular-nums">${formatted}</div>;
    },
  },
  {
    id: "price_bs",
    header: () => <div className="text-right">VES</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price_usd"));
      return <PriceBsCell priceUsd={price} />;
    },
  },
  {
    accessorKey: "active",
    header: () => <div className="text-center">Estado</div>,
    cell: ({ row }) => {
      const isActive = row.getValue("active");
      return (
        <div className="text-center">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                ? "bg-success/15 text-success hover:bg-success/20 border-0 text-[11px] px-1.5 py-0"
                : "text-[11px] px-1.5 py-0"
            }
          >
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      );
    },
  },
  {
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
            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
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
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
  },
];
