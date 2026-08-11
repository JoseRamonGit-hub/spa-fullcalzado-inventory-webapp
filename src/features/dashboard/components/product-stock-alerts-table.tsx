import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import type { DashboardProductStockAlert, ProductStockAlertType } from "@/types";
import { formatProductStagnantDays } from "@/features/inventory/product-stagnation";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<DashboardProductStockAlert>();

const baseColumns = [
  columnHelper.accessor("code", {
    header: "Código",
    cell: ({ getValue }) => (
      <span className="product-code inline-flex items-center gap-1 uppercase">
        {getValue()}
        <ChevronRight className="size-3 opacity-60" aria-hidden="true" />
      </span>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("description", {
    header: "Descripción",
    cell: ({ getValue }) => <OverflowTooltip className="max-w-table-row">{getValue()}</OverflowTooltip>,
    enableSorting: false,
  }),
  columnHelper.accessor("stock", {
    header: () => <div className="text-right">Stock</div>,
    cell: ({ getValue }) => {
      const stock = getValue();

      return (
        <span
          className={cn(
            "tabular-value block text-right font-medium",
            stock === 0 ? "text-destructive" : stock <= 3 ? "text-warning" : "text-foreground",
          )}
        >
          {stock}
        </span>
      );
    },
    enableSorting: false,
  }),
] as ColumnDef<DashboardProductStockAlert>[];

const stagnantColumns = [
  ...baseColumns,
  columnHelper.accessor("stagnantDays", {
    header: () => <div className="text-right">Sin salida</div>,
    cell: ({ getValue }) => {
      const stagnantDays = getValue();

      return (
        <span className="tabular-value block text-right font-medium">{formatProductStagnantDays(stagnantDays)}</span>
      );
    },
    enableSorting: false,
  }),
  columnHelper.accessor("active", {
    header: () => <div className="text-center">Estado</div>,
    cell: ({ getValue }) => (
      <div className="text-center">
        <Badge variant={getValue() ? "success" : "destructive"}>{getValue() ? "Activo" : "Inactivo"}</Badge>
      </div>
    ),
    enableSorting: false,
  }),
] as ColumnDef<DashboardProductStockAlert>[];

const tableConfig = {
  low_stock: {
    columns: baseColumns,
    emptyMessage: "No hay productos con stock bajo.",
    scrollAreaLabel: "Productos con stock bajo",
    tableClassName: "min-w-[32rem]",
  },
  stagnant: {
    columns: stagnantColumns,
    emptyMessage: "No hay productos estancados.",
    scrollAreaLabel: "Productos estancados",
    tableClassName: "min-w-[42rem]",
  },
} satisfies Record<
  ProductStockAlertType,
  {
    columns: ColumnDef<DashboardProductStockAlert>[];
    emptyMessage: string;
    scrollAreaLabel: string;
    tableClassName: string;
  }
>;

type ProductStockAlertsTableProps = {
  type: ProductStockAlertType;
  products: DashboardProductStockAlert[];
  isLoading: boolean;
  onProductClick: (product: DashboardProductStockAlert) => void;
};

export function ProductStockAlertsTable({ type, products, isLoading, onProductClick }: ProductStockAlertsTableProps) {
  const config = tableConfig[type];

  return (
    <DataTable
      columns={config.columns}
      data={products}
      isLoading={isLoading}
      skeletonRowCount={3}
      hidePagination
      emptyMessage={config.emptyMessage}
      emptyStateClassName="h-24"
      onRowClick={onProductClick}
      getRowAriaLabel={(product) => `Ver detalles de ${product.code}`}
      getRowId={(product) => product.productId}
      getRowClassName={() =>
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none"
      }
      tableClassName={config.tableClassName}
      scrollAreaLabel={config.scrollAreaLabel}
    />
  );
}
