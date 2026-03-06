import type { ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useExchangeRate } from "@/features/exchange_rates/hooks";

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

  return <div className="text-right font-medium text-muted-foreground">Bs {formatted}</div>;
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "code",
    header: "Código",
  },
  {
    accessorKey: "description",
    header: "Descripción",
  },
  {
    accessorKey: "stock",
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("stock")}</div>;
    },
  },
  {
    accessorKey: "price_usd",
    header: () => <div className="text-right">Precio (USD)</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price_usd"));
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
      return <div className="text-right font-medium">${formatted}</div>;
    },
  },
  {
    id: "price_bs",
    header: () => <div className="text-right">Precio (Bs)</div>,
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
          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Activo" : "Inactivo"}</Badge>
        </div>
      );
    },
  },
];
