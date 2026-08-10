import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import type { DashboardProductStockAlert, ProductStockAlertType } from "@/types";

const columnHelper = createColumnHelper<DashboardProductStockAlert>();

const baseColumns = [
  columnHelper.accessor("code", {
    header: "Código",
    cell: ({ getValue }) => <span className="product-code font-bold uppercase">{getValue()}</span>,
    enableSorting: false,
  }),
  columnHelper.accessor("description", {
    header: "Descripción",
    cell: ({ getValue }) => <OverflowTooltip className="max-w-table-row">{getValue()}</OverflowTooltip>,
    enableSorting: false,
  }),
  columnHelper.accessor("stock", {
    header: () => <div className="text-right">Stock</div>,
    cell: ({ getValue }) => <span className="block text-right font-medium tabular-nums">{getValue()}</span>,
    enableSorting: false,
  }),
] as ColumnDef<DashboardProductStockAlert>[];

const stagnantColumns = [
  ...baseColumns,
  columnHelper.accessor("stagnantDays", {
    header: () => <div className="text-right">Sin salida</div>,
    cell: ({ getValue }) => <span className="block text-right font-medium tabular-nums">{getValue() ?? 0} días</span>,
    enableSorting: false,
  }),
  columnHelper.accessor("active", {
    header: () => <div className="text-center">Estado</div>,
    cell: ({ getValue }) => (
      <div className="text-center">
        <Badge variant={getValue() ? "success" : "secondary"}>{getValue() ? "Activo" : "Inactivo"}</Badge>
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
  },
  stagnant: {
    columns: stagnantColumns,
    emptyMessage: "No hay productos estancados.",
    scrollAreaLabel: "Productos estancados",
  },
} satisfies Record<
  ProductStockAlertType,
  {
    columns: ColumnDef<DashboardProductStockAlert>[];
    emptyMessage: string;
    scrollAreaLabel: string;
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
      hidePagination
      emptyMessage={config.emptyMessage}
      emptyStateClassName="h-24"
      onRowClick={onProductClick}
      getRowAriaLabel={(product) => `Ver detalles de ${product.code}`}
      getRowId={(product) => product.productId}
      scrollAreaLabel={config.scrollAreaLabel}
    />
  );
}
