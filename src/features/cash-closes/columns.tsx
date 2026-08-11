import type { CashCloseWithRelations } from "@/types";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";

const columnHelper = createColumnHelper<CashCloseWithRelations>();

export const columns = [
  columnHelper.accessor("closed_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ getValue }) => <span className="data-value font-medium">{formatDate(getValue()) || "—"}</span>,
  }),
  columnHelper.accessor((cashClose) => cashClose.total_billed_operations ?? cashClose.total_transactions, {
    id: "billed_operations",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Operaciones facturadas" className="justify-end" />
    ),
    cell: ({ getValue }) => <span className="data-value block text-right">{getValue() ?? "—"}</span>,
  }),
  columnHelper.accessor("total_units_sold", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unidades" className="justify-end" />,
    cell: ({ getValue }) => <span className="data-value block text-right">{getValue() ?? "—"}</span>,
  }),
  columnHelper.accessor("total_returns", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Devoluciones" className="justify-end" />,
    cell: ({ getValue, row }) => {
      const count = getValue();
      if (!count) return <span className="data-value text-muted-foreground block text-right">—</span>;
      return (
        <span
          className="data-value block text-right text-orange-500"
          title={`Crédito: ${formatCurrencyUSD(row.original.total_returns_usd)}`}
        >
          {count}
        </span>
      );
    },
  }),
  columnHelper.accessor("total_usd", {
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total producido USD" className="justify-end" />
    ),
    cell: ({ getValue }) => (
      <span className="data-value block text-right font-medium">{formatCurrencyUSD(getValue())}</span>
    ),
  }),
  columnHelper.accessor("total_ves", {
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total producido Bs." className="justify-end" />
    ),
    cell: ({ getValue }) => (
      <span className="data-value block text-right font-medium">{formatCurrencyVES(getValue())}</span>
    ),
  }),
  columnHelper.display({
    id: "closed_by",
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cerrado por" />,
    cell: ({ row }) => (
      <OverflowTooltip focusable={false} className="text-muted-foreground max-w-44">
        {row.original.users?.fullname || "—"}
      </OverflowTooltip>
    ),
  }),
] as ColumnDef<CashCloseWithRelations>[];
