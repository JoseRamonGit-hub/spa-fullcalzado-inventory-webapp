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
    cell: ({ getValue }) => <span className="text-muted-foreground font-mono tabular-nums">#{getValue()}</span>,
    enableSorting: false,
  }),
  columnHelper.accessor("code", {
    header: "Código",
    cell: ({ getValue }) => (
      <span className="product-code inline-flex items-center gap-1 font-bold uppercase">
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
    meta: { hideOnMobile: true },
  }),
  columnHelper.accessor("units", {
    header: () => <div className="text-right">Unidades</div>,
    cell: ({ getValue }) => <span className="block text-right font-medium tabular-nums">{getValue()}</span>,
    enableSorting: false,
  }),
  columnHelper.accessor("grossUsd", {
    header: () => <div className="text-right">USD bruto</div>,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyUSD(getValue())}</span>
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
      hidePagination
      emptyMessage="No hay productos vendidos en este período."
      emptyStateClassName="h-32"
      onRowClick={onProductClick}
      getRowAriaLabel={(product) => `Ver detalles de ${product.code}`}
      getRowId={(product) => product.productId}
      getRowClassName={() =>
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none"
      }
      tableClassName="[&_tbody_tr]:h-11 md:[&_tbody_tr]:h-[30px]"
      scrollAreaLabel="Top productos"
    />
  );
}
