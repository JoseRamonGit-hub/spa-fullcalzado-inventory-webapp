import type { CashClose } from "@/types";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";

const columHelper = createColumnHelper<CashClose>();

export const columns = [
  columHelper.accessor("closed_at", {
    header: "Fecha",
    cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatDate(getValue())}</span>,
  }),
  columHelper.accessor("total_transactions", {
    header: () => <div className="text-right">Ventas</div>,
    cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue()}</span>,
  }),
  columHelper.accessor("total_units_sold", {
    header: () => <div className="text-right">Unidades</div>,
    cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue()}</span>,
  }),
  columHelper.accessor("total_returns", {
    header: () => <div className="text-right">Devol.</div>,
    cell: ({ getValue }) => <span className="text-warning block text-right tabular-nums">{getValue()}</span>,
    meta: { hideOnMobile: true },
  }),
  columHelper.accessor("total_usd", {
    header: () => <div className="text-right">USD Neto</div>,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyUSD(getValue())}</span>
    ),
  }),
  columHelper.accessor("total_ves", {
    header: () => <div className="text-right">VES Neto</div>,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyVES(getValue())}</span>
    ),
  }),
  columHelper.accessor("closed_by", {
    header: "Cerrado por",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
] as ColumnDef<CashClose>[];
