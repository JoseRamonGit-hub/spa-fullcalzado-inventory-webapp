import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD, formatCurrencyVES, formatDate, formatInteger } from "@/utils/formatters";
import type { CashCloseHistoryRow } from "./cash-close-ledger";
import { CasheaStatusIndicator } from "./components/cashea-status-indicator";

const columnHelper = createColumnHelper<CashCloseHistoryRow>();

const MISSING_VALUE = "—";

export const columns = [
  columnHelper.accessor("date", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ getValue }) => (
      <span className="tabular-value inline-flex items-center gap-1 font-medium whitespace-nowrap">
        {formatDate(`${getValue()}T12:00:00`)}
        <ChevronRight className="text-muted-foreground size-3 shrink-0 opacity-60" aria-hidden="true" />
      </span>
    ),
  }),
  columnHelper.accessor((row) => row.figures.produced.usd, {
    id: "produced_usd",
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total producido USD" />,
    cell: ({ getValue }) => <span className="data-value font-semibold">{formatCurrencyUSD(getValue())}</span>,
  }),
  columnHelper.accessor((row) => row.figures.produced.ves, {
    id: "produced_ves",
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total producido Bs." />,
    cell: ({ getValue }) => <span className="data-value font-medium">{formatCurrencyVES(getValue())}</span>,
  }),
  columnHelper.accessor((row) => row.figures.billed.usd, {
    id: "billed_usd",
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total facturado" />,
    cell: ({ getValue }) => <span className="data-value">{formatCurrencyUSD(getValue())}</span>,
  }),
  columnHelper.display({
    id: "cashea_collection",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cobro Cashea" />,
    cell: ({ row }) => <CasheaStatusIndicator status={row.original.cashea} />,
  }),
  columnHelper.accessor((row) => row.figures.billedOperations, {
    id: "billed_operations",
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Operaciones" />,
    cell: ({ getValue }) => <span className="tabular-value">{formatInteger(getValue())}</span>,
  }),
  columnHelper.accessor((row) => row.figures.units, {
    id: "units",
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unidades" />,
    cell: ({ getValue }) => <span className="tabular-value">{formatInteger(getValue())}</span>,
  }),
  columnHelper.accessor((row) => (row.kind === "closed" ? row.cashClose.users?.fullname || "" : ""), {
    id: "closed_by",
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cerrado por" />,
    cell: ({ row }) =>
      row.original.kind === "unclosed" ? (
        <span className="text-warning-foreground dark:text-warning inline-flex items-center gap-1.5 font-medium whitespace-nowrap">
          <span className="bg-warning size-1.5 shrink-0 rounded-full" aria-hidden="true" />
          Sin cierre
        </span>
      ) : (
        <OverflowTooltip focusable={false} className="text-muted-foreground max-w-44">
          {row.original.cashClose.users?.fullname || MISSING_VALUE}
        </OverflowTooltip>
      ),
  }),
] as ColumnDef<CashCloseHistoryRow>[];
