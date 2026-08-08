import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { IterationCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { getMovementTypeInfo } from "@/features/movements/movement-presentation";
import { cn } from "@/lib/utils";
import type { ProductHistoryEvent } from "@/types";
import { formatDate, formatTime } from "@/utils/formatters";

const columnHelper = createColumnHelper<ProductHistoryEvent>();

function getSignedQuantity(event: ProductHistoryEvent) {
  if (event.type === "activation" || event.type === "deactivation") return null;
  if (event.type === "entry" || event.type === "return") return event.quantity;
  return event.type === "exit" ? -event.quantity : event.quantity;
}

function getStockAfter(event: ProductHistoryEvent) {
  if (event.stock_before == null) return null;
  const signedQuantity = getSignedQuantity(event);
  return signedQuantity == null ? null : event.stock_before + signedQuantity;
}

export const productHistoryColumns = [
  columnHelper.accessor("type", {
    header: () => <div className="text-center">Tipo</div>,
    cell: ({ row }) => {
      const { variant, label, title, showReturnIcon } = getMovementTypeInfo(row.original);
      return (
        <span className="flex justify-center">
          <Badge variant={variant} title={title}>
            {showReturnIcon ? <IterationCcw aria-hidden="true" /> : null}
            {label}
          </Badge>
        </span>
      );
    },
  }),
  columnHelper.accessor("date", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatDate(row.original.created_at)}</span>
    ),
  }),
  columnHelper.accessor("time", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hora" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatTime(row.original.created_at)}</span>
    ),
  }),
  columnHelper.display({
    id: "detail",
    header: "Detalle",
    cell: ({ row }) => <span className="text-muted-foreground">{getMovementTypeInfo(row.original).title}</span>,
  }),
  columnHelper.accessor("quantity", {
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ row }) => {
      const signedQuantity = getSignedQuantity(row.original);
      if (signedQuantity == null || signedQuantity === 0) {
        return <span className="text-muted-foreground block text-right">—</span>;
      }

      return (
        <span
          className={cn(
            "block text-right font-medium tabular-nums",
            signedQuantity > 0 ? "text-emerald-500" : "text-red-500",
          )}
        >
          {signedQuantity > 0 ? "+" : "−"}
          {Math.abs(signedQuantity)}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "stock",
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => {
      const stockAfter = getStockAfter(row.original);
      if (stockAfter == null) return <span className="text-muted-foreground block text-right">—</span>;

      return (
        <div className="flex items-center justify-end gap-1.5 tabular-nums">
          <span className="text-muted-foreground">{row.original.stock_before}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground font-medium">{stockAfter}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("user_fullname", {
    header: "Usuario",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
] as ColumnDef<ProductHistoryEvent>[];
