import type { ColumnDef } from "@tanstack/react-table";
import type { CashClose } from "@/types";

export const columns: ColumnDef<CashClose>[] = [
  {
    accessorKey: "date",
    header: "Fecha",
  },
  {
    accessorKey: "total_transactions",
    header: () => <div className="text-right">Transacciones</div>,
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("total_transactions")}</div>;
    },
  },
  {
    accessorKey: "total_units_sold",
    header: () => <div className="text-right">Unidades</div>,
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue("total_units_sold")}</div>;
    },
  },
  {
    accessorKey: "total_usd",
    header: () => <div className="text-right">USD</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_usd"));
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
      return <div className="text-right font-medium">${formatted}</div>;
    },
  },
  {
    accessorKey: "total_ves",
    header: () => <div className="text-right">VES</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("total_ves"));
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "exchange_rate",
    header: () => <div className="text-right">Tasa</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("exchange_rate"));
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "closed_by",
    header: "Cerrado por",
  },
];
