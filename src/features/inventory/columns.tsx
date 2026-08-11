import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";
import { ProductMaintenanceActions } from "@/features/inventory/components/product-maintenance-actions";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<Product>();

export type InventoryTableMeta = {
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
};

type PriceBsCellProps = {
  priceUsd: number;
  exchangeRate?: number;
  isExchangeRateLoading: boolean;
  isExchangeRateError: boolean;
};

type InventoryColumnsOptions = {
  exchangeRate?: number;
  isExchangeRateLoading: boolean;
  isExchangeRateError: boolean;
  isAdmin: boolean;
};

function renderPriceBsCell({ priceUsd, exchangeRate, isExchangeRateLoading, isExchangeRateError }: PriceBsCellProps) {
  if (isExchangeRateLoading) {
    return (
      <div className="text-muted-foreground text-right" aria-label="Consultando tasa de cambio">
        …
      </div>
    );
  }

  if (isExchangeRateError) {
    return (
      <div className="text-warning text-right font-medium" title="No se pudo consultar la tasa de cambio">
        No disponible
      </div>
    );
  }

  if (!exchangeRate) {
    return <div className="text-warning text-right font-medium">Sin tasa</div>;
  }

  const priceBs = priceUsd * exchangeRate;

  return <div className="data-value text-muted-foreground text-right">{formatCurrencyVES(priceBs)}</div>;
}

export function getColumns({
  exchangeRate,
  isExchangeRateLoading,
  isExchangeRateError,
  isAdmin,
}: InventoryColumnsOptions) {
  const columns = [
    columnHelper.accessor("code", {
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
      cell: ({ getValue }) => <span className="product-code uppercase">{getValue()}</span>,
    }),
    columnHelper.accessor("description", {
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
      cell: ({ getValue }) => <OverflowTooltip className="max-w-table-row">{getValue()}</OverflowTooltip>,
    }),
    columnHelper.accessor("stock", {
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" className="justify-end" />,
      cell: ({ getValue }) => (
        <span
          className={cn(
            "data-value block text-right font-medium",
            getValue() === 0 ? "text-destructive" : getValue() <= 3 ? "text-warning" : "text-foreground",
          )}
        >
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("price_usd", {
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="USD" className="justify-end" />,
      cell: ({ getValue }) => (
        <span className="data-value block text-right font-medium">{formatCurrencyUSD(getValue())}</span>
      ),
    }),
    columnHelper.accessor((row) => row.price_usd, {
      id: "price_ves",
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bs." className="justify-end" />,
      cell: ({ row }) =>
        renderPriceBsCell({
          priceUsd: row.original.price_usd,
          exchangeRate,
          isExchangeRateLoading,
          isExchangeRateError,
        }),
    }),
    columnHelper.accessor("active", {
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" className="justify-center" />,
      cell: ({ getValue }) => (
        <div className="text-center">
          <Badge variant={getValue() ? "success" : "secondary"}>{getValue() ? "Activo" : "Inactivo"}</Badge>
        </div>
      ),
    }),
  ] as ColumnDef<Product>[];

  if (isAdmin) {
    columns.push(
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-center">Acciones</div>,
        meta: { hideOnMobile: true },
        cell: ({ row, table }) => {
          const product = row.original;
          const meta = table.options.meta as InventoryTableMeta;

          return (
            <div className="flex justify-center">
              <ProductMaintenanceActions
                product={product}
                onEdit={meta.onEdit}
                onAdjustStock={meta.onAdjustStock}
                onToggleStatus={meta.onToggleStatus}
              />
            </div>
          );
        },
      }),
    );
  }

  return columns;
}
