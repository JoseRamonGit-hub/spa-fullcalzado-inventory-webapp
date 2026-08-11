import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import type { DashboardTopProduct } from "@/types";
import { formatCurrencyUSD } from "@/utils/formatters";

const columnHelper = createColumnHelper<DashboardTopProduct>();

const columns = [
  columnHelper.accessor("rank", {
    header: () => <span className="sr-only">Posición</span>,
    cell: ({ getValue }) => <span className="data-value text-muted-foreground">#{getValue()}</span>,
    enableSorting: false,
  }),
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
  columnHelper.accessor("units", {
    header: () => <div className="text-right">Unidades</div>,
    cell: ({ getValue }) => <span className="data-value block text-right font-medium">{getValue()}</span>,
    enableSorting: false,
  }),
  columnHelper.accessor("grossUsd", {
    header: () => <div className="text-right">USD bruto</div>,
    cell: ({ getValue }) => (
      <span className="data-value block text-right font-medium">{formatCurrencyUSD(getValue())}</span>
    ),
    enableSorting: false,
  }),
] as ColumnDef<DashboardTopProduct>[];

type TopProductsTableProps = {
  products: DashboardTopProduct[];
  isLoading: boolean;
  onProductClick: (product: DashboardTopProduct) => void;
};

export function TopProductsTable({ products, isLoading, onProductClick }: TopProductsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={products}
      isLoading={isLoading}
      skeletonRowCount={4}
      hidePagination
      emptyMessage="No hay productos vendidos en este período."
      emptyStateClassName="h-32"
      onRowClick={onProductClick}
      getRowAriaLabel={(product) => `Ver detalles de ${product.code}`}
      getRowId={(product) => product.productId}
      getRowClassName={() =>
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none"
      }
      tableClassName="min-w-[42rem]"
      scrollAreaLabel="Productos más vendidos"
    />
  );
}
