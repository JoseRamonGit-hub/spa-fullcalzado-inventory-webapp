import type { ColumnDef } from "@tanstack/react-table";
import type { CashClose } from "@/types";
import { formatCurrencyUSD, formatCurrencyVES } from "@/utils/formatters";

export const columns: ColumnDef<CashClose>[] = [
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => <span className="font-medium tabular-nums">{row.getValue("date")}</span>,
  },
  {
    accessorKey: "total_transactions",
    header: () => <div className="text-right">Transacciones</div>,
    cell: ({ row }) => {
      return <div className="text-right tabular-nums">{row.getValue("total_transactions")}</div>;
    },
  },
  {
    accessorKey: "total_units_sold",
    header: () => <div className="text-right">Unidades</div>,
    cell: ({ row }) => {
      return <div className="text-right tabular-nums">{row.getValue("total_units_sold")}</div>;
    },
  },
  {
    accessorKey: "total_usd",
    header: () => <div className="text-right">USD</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_usd"));
      return <div className="text-right font-medium tabular-nums">{formatCurrencyUSD(price)}</div>;
    },
  },
  {
    accessorKey: "total_ves",
    header: () => <div className="text-right">VES</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_ves"));
      return <div className="text-right font-medium tabular-nums">{formatCurrencyVES(price)}</div>;
    },
  },
  {
    accessorKey: "exchange_rate",
    header: () => <div className="text-right">Tasa</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("exchange_rate"));
      return <div className="text-muted-foreground text-right tabular-nums">{formatCurrencyVES(price)}</div>;
    },
  },
  {
    accessorKey: "closed_by",
    header: "Cerrado por",
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("closed_by")}</span>,
  },
];
