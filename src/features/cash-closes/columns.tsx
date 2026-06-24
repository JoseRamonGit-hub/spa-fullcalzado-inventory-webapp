import type { CashCloseWithRelations } from "@/types";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";

const columnHelper = createColumnHelper<CashCloseWithRelations>();

export const columns = [
  columnHelper.accessor("closed_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatDate(getValue())}</span>,
  }),
  columnHelper.accessor("total_transactions", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ventas" className="justify-end" />,
    cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue()}</span>,
  }),
  columnHelper.accessor("total_units_sold", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unidades" className="justify-end" />,
    cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue()}</span>,
  }),
  columnHelper.accessor("total_returns", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Devol." className="justify-end" />,
    cell: ({ getValue, row }) => {
      const count = getValue();
      if (!count) return <span className="text-muted-foreground block text-right tabular-nums">—</span>;
      return (
        <span
          className="block text-right text-orange-500 tabular-nums"
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
      <DataTableColumnHeader column={column} title="Total Producido USD" className="justify-end" />
    ),
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyUSD(getValue())}</span>
    ),
  }),
  columnHelper.accessor("total_ves", {
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Producido BS" className="justify-end" />
    ),
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyVES(getValue())}</span>
    ),
  }),
  columnHelper.display({
    id: "closed_by",
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cerrado por" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.users?.fullname ?? "—"}</span>,
  }),
] as ColumnDef<CashCloseWithRelations>[];
