import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardTopProduct, DashboardTopProductsRankMode } from "@/types";
import { formatCurrencyUSD, formatInteger } from "@/utils/formatters";

const columnHelper = createColumnHelper<DashboardTopProduct>();

function participationLabel(rankBy: DashboardTopProductsRankMode) {
  return rankBy === "units" ? "del total de unidades" : "del total de ventas brutas";
}

function createColumns(rankBy: DashboardTopProductsRankMode) {
  return [
    columnHelper.accessor("rank", {
      header: () => <span className="sr-only">Posición</span>,
      cell: ({ getValue }) => <span className="tabular-value text-muted-foreground">#{getValue()}</span>,
      enableSorting: false,
    }),
    columnHelper.accessor("code", {
      header: "Código",
      cell: ({ getValue }) => (
        <span
          className="product-code inline-flex max-w-40 items-center justify-start gap-1 overflow-hidden uppercase"
          title={getValue()}
        >
          <span className="truncate">{getValue()}</span>
          <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden="true" />
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
      header: () => (
        <div
          className={cn(
            "text-right",
            rankBy === "units" ? "text-foreground font-semibold" : "text-muted-foreground font-medium",
          )}
        >
          Unidades
          {rankBy === "units" ? <span className="sr-only">, criterio de orden activo</span> : null}
        </div>
      ),
      cell: ({ getValue }) => (
        <span
          className={cn(
            "tabular-value block text-right",
            rankBy === "units" ? "text-foreground font-bold" : "text-muted-foreground font-medium",
          )}
        >
          {formatInteger(getValue())}
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("grossUsd", {
      header: () => (
        <div
          className={cn(
            "text-right",
            rankBy === "gross_usd" ? "text-foreground font-semibold" : "text-muted-foreground font-medium",
          )}
        >
          USD bruto
          {rankBy === "gross_usd" ? <span className="sr-only">, criterio de orden activo</span> : null}
        </div>
      ),
      cell: ({ getValue }) => (
        <span
          className={cn(
            "data-value block text-right",
            rankBy === "gross_usd" ? "text-foreground font-bold" : "text-muted-foreground font-medium",
          )}
        >
          {formatCurrencyUSD(getValue())}
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("participationPercentage", {
      header: () => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <span>{rankBy === "units" ? "Participación en unidades" : "Participación en USD bruto"}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Cómo se calcula la participación ${participationLabel(rankBy)}`}
              >
                <Info aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 leading-relaxed">
              {rankBy === "units"
                ? "Porcentaje que este producto representa del total de unidades vendidas en el período."
                : "Porcentaje que este producto representa del total de ventas brutas en el período."}
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      cell: ({ getValue }) => {
        const percentage = getValue() ?? 0;
        return (
          <div
            className="ml-auto flex w-36 items-center justify-end gap-2"
            aria-label={`${percentage.toFixed(1)}% ${participationLabel(rankBy)}`}
          >
            <div className="bg-muted h-1.5 min-w-16 flex-1 overflow-hidden rounded-full" aria-hidden="true">
              <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, percentage)}%` }} />
            </div>
            <span className="tabular-value w-11 text-right font-semibold">{percentage.toFixed(1)}%</span>
          </div>
        );
      },
      enableSorting: false,
    }),
  ] as ColumnDef<DashboardTopProduct>[];
}

type TopProductsTableProps = {
  products: DashboardTopProduct[];
  isLoading: boolean;
  rankBy: DashboardTopProductsRankMode;
  onProductClick: (product: DashboardTopProduct) => void;
};

export function TopProductsTable({ products, isLoading, rankBy, onProductClick }: TopProductsTableProps) {
  return (
    <DataTable
      columns={createColumns(rankBy)}
      data={products}
      isLoading={isLoading}
      skeletonRowCount={4}
      hidePagination
      emptyMessage="No se vendieron productos en este período."
      emptyStateClassName="h-32"
      onRowClick={onProductClick}
      getRowAriaLabel={(product) =>
        `Ver detalle de ${product.code}: ${product.description}, ${formatInteger(product.units)} unidades, ${formatCurrencyUSD(product.grossUsd)}, ${(product.participationPercentage ?? 0).toFixed(1)}% ${participationLabel(rankBy)}`
      }
      getRowId={(product) => product.productId}
      getRowClassName={() =>
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none"
      }
      tableClassName="min-w-[52rem]"
      scrollAreaLabel="Productos más vendidos"
    />
  );
}
