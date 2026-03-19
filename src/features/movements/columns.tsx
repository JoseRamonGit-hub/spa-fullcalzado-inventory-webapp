import type { InventoryMovementWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/utils/formatters";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

const columHelper = createColumnHelper<InventoryMovementWithRelations>();

export const columns = [
  columHelper.accessor("type", {
    header: () => <div className="text-center">Tipo</div>,
    cell: ({ getValue, row }) => {
      const type = getValue();
      const isExchangeExit = type === "exit" && row.original.return_id;

      const variant = type === "entry" ? "success" : type === "return" ? "refund" : isExchangeExit ? "exchange" : "destructive";
      const label =
        type === "entry" ? "Entrada" : type === "return" ? "Devolución" : isExchangeExit ? "Cambio" : "Salida";
      return (
        <span className="flex justify-center">
          <Badge variant={variant}>{label}</Badge>
        </span>
      );
    },
  }),
  columHelper.accessor("date", {
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatDate(row.original.created_at)}</span>
    ),
  }),
  columHelper.accessor("time", {
    header: "Hora",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatTime(row.original.created_at)}</span>
    ),
  }),
  columHelper.accessor("products.code", {
    header: "Código",
    cell: ({ getValue }) => <span className="product-code font-bold uppercase">{getValue()}</span>,
  }),
  columHelper.accessor("products.description", {
    header: "Descripción",
    cell: ({ getValue }) => <span className="max-w-table-row block truncate">{getValue()}</span>,
  }),
  columHelper.accessor("quantity", {
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ getValue, row }) => {
      const type = row.original.type;
      const isInflow = type === "entry" || type === "return";
      const sign = isInflow ? "+" : "−";

      return (
        <span className="flex items-center justify-end gap-1">
          <span
            className={cn(
              "text-[10px] font-semibold",
              isInflow ? "text-emerald-500" : "text-red-500",
            )}
          >
            {sign}
          </span>
          <span className="font-medium tabular-nums">{getValue()}</span>
        </span>
      );
    },
  }),
  columHelper.accessor("users.fullname", {
    header: "Usuario",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
] as ColumnDef<InventoryMovementWithRelations>[];
