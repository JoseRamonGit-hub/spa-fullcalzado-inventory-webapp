import type { CashClose } from "@/types";
import { createColumnHelper } from "@tanstack/react-table";
import { formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";

const columHelper = createColumnHelper<CashClose>();

export const columns = [
  columHelper.accessor("date", {
    header: "Fecha",
    cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatDate(getValue())}</span>,
  }),
  columHelper.accessor("total_transactions", {
    header: () => <div className="text-right">Transacciones</div>,
    cell: ({ getValue }) => <div className="text-right tabular-nums">{getValue()}</div>,
  }),
  columHelper.accessor("total_units_sold", {
    header: () => <div className="text-right">Unidades</div>,
    cell: ({ getValue }) => <div className="text-right tabular-nums">{getValue()}</div>,
  }),
  columHelper.accessor("total_usd", {
    header: () => <div className="text-right">USD</div>,
    cell: ({ getValue }) => <div className="text-right font-medium tabular-nums">{formatCurrencyUSD(getValue())}</div>,
  }),
  columHelper.accessor("total_ves", {
    header: () => <div className="text-right">VES</div>,
    cell: ({ getValue }) => <div className="text-right font-medium tabular-nums">{formatCurrencyVES(getValue())}</div>,
  }),
  columHelper.accessor("closed_by", {
    header: "Cerrado por",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
];
