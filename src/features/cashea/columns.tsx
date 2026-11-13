import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { CasheaOrder, CasheaOrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { formatCalendarDateString, formatCurrencyUSD, formatInteger } from "@/utils/formatters";
import { casheaOrderStatusLabels, getCasheaOrderAgeDays } from "./cashea-receivables";

const columnHelper = createColumnHelper<CasheaOrder>();

const statusBadgeVariants: Record<CasheaOrderStatus, "warning" | "success" | "secondary"> = {
  pending: "warning",
  collected: "success",
  voided: "secondary",
};

function formatAgeDays(days: number | null) {
  if (days == null) return "—";
  return `${formatInteger(days)} ${days === 1 ? "día" : "días"}`;
}

function amountColumn(key: "total_usd" | "paid_today_usd" | "financed_usd" | "expected_net_usd", title: string) {
  return columnHelper.accessor(key, {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} className="justify-end" />,
    cell: ({ getValue }) => <span className="data-value block text-right">{formatCurrencyUSD(getValue())}</span>,
  });
}

export const columns = [
  columnHelper.accessor("order_number", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orden" />,
    cell: ({ getValue }) => <span className="product-code">{getValue()}</span>,
  }),
  columnHelper.accessor("invoice_number", {
    header: "Factura",
    cell: ({ getValue }) => <span className="product-code text-muted-foreground">{getValue()}</span>,
  }),
  columnHelper.accessor("sale_date", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ getValue }) => (
      <span className="tabular-value text-muted-foreground">{formatCalendarDateString(getValue()) || "—"}</span>
    ),
  }),
  amountColumn("total_usd", "Total"),
  amountColumn("paid_today_usd", "Cobrado hoy"),
  amountColumn("financed_usd", "Monto financiado"),
  amountColumn("expected_net_usd", "Neto esperado"),
  columnHelper.accessor("status", {
    header: () => <div className="text-center">Estado</div>,
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <span className="flex justify-center">
          <Badge variant={statusBadgeVariants[status]}>{casheaOrderStatusLabels[status]}</Badge>
        </span>
      );
    },
  }),
  columnHelper.accessor((order) => getCasheaOrderAgeDays(order.sale_date), {
    id: "age",
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Antigüedad" className="justify-end" />,
    cell: ({ getValue }) => (
      <span className="tabular-value text-muted-foreground block text-right">{formatAgeDays(getValue())}</span>
    ),
  }),
] as ColumnDef<CasheaOrder>[];
