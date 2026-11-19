import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";
import { formatCurrencyUSD, formatCurrencyVES, formatDate, formatInteger } from "@/utils/formatters";
import type { CashCloseHistoryRow } from "./cash-close-ledger";
import { CasheaStatusIndicator } from "./components/cashea-status-indicator";

const columnHelper = createColumnHelper<CashCloseHistoryRow>();

const numericHeading = "justify-end [&_button]:flex-row-reverse [&_button]:text-right";
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total producido USD" className={numericHeading} />
    ),
    cell: ({ getValue }) => (
      <span className="data-value block text-right font-bold">{formatCurrencyUSD(getValue())}</span>
    ),
  }),
  columnHelper.accessor((row) => row.figures.produced.ves, {
    id: "produced_ves",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total producido Bs." className={numericHeading} />
    ),
    cell: ({ getValue }) => (
      <span className="data-value block text-right font-semibold">{formatCurrencyVES(getValue())}</span>
    ),
  }),
  columnHelper.accessor((row) => row.figures.billed.usd, {
    id: "billed_usd",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total facturado" className={numericHeading} />
    ),
    cell: ({ getValue }) => <span className="data-value block text-right">{formatCurrencyUSD(getValue())}</span>,
  }),
  columnHelper.display({
    id: "cashea_collection",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Cobro Cashea"
        icon={<CasheaLogoIcon className="size-3.5 rounded-[3px]" />}
      />
    ),
    cell: ({ row }) => <CasheaStatusIndicator status={row.original.cashea} />,
  }),
  columnHelper.accessor((row) => row.figures.billedOperations, {
    id: "billed_operations",
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Operaciones" className={numericHeading} />,
    cell: ({ getValue }) => <span className="tabular-value block text-right">{formatInteger(getValue())}</span>,
  }),
  columnHelper.accessor((row) => row.figures.units, {
    id: "units",
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Unidades" className={numericHeading} />,
    cell: ({ getValue }) => <span className="tabular-value block text-right">{formatInteger(getValue())}</span>,
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
