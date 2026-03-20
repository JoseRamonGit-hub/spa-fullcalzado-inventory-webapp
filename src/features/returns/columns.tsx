import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { ReturnWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, formatCurrencyUSD } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const columnHelper = createColumnHelper<ReturnWithRelations>();

export const columns = [
  columnHelper.display({
    id: "expand",
    header: () => null,
    cell: ({ row }) => (
      <span className="flex justify-center">
        <ChevronRight
          className={cn("text-muted-foreground size-4 transition-transform", row.getIsExpanded() && "rotate-90")}
        />
      </span>
    ),
    size: 32,
  }),
  columnHelper.accessor("type", {
    header: () => <div className="text-center">Tipo</div>,
    cell: ({ getValue }) => {
      const type = getValue();
      return (
        <span className="flex justify-center">
          <Badge variant={type === "exchange" ? "exchange" : "refund"}>
            {type === "exchange" ? "Cambio" : "Devolución"}
          </Badge>
        </span>
      );
    },
  }),
  columnHelper.accessor("date", {
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatDate(row.original.created_at)}</span>
    ),
    meta: { hideOnMobile: true },
  }),
  columnHelper.accessor("time", {
    header: "Hora",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatTime(row.original.created_at)}</span>
    ),
    meta: { hideOnMobile: true },
  }),
  columnHelper.display({
    id: "items",
    header: "Artículos",
    cell: ({ row }) => {
      const returnCount = row.original.return_items.length;
      const exchangeCount = row.original.transactions.length;
      return (
        <span className="text-muted-foreground text-xs tabular-nums">
          {returnCount} dev.{exchangeCount > 0 ? ` / ${exchangeCount} camb.` : ""}
        </span>
      );
    },
  }),
  columnHelper.accessor("credit_usd", {
    header: () => <div className="text-right">Crédito</div>,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyUSD(getValue())}</span>
    ),
  }),
  columnHelper.accessor("difference_usd", {
    header: () => <div className="text-right">Diferencia</div>,
    cell: ({ getValue }) => {
      const v = getValue();
      return (
        <span
          className={cn(
            "block text-right font-medium tabular-nums",
            v > 0 ? "text-success" : v < 0 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {v > 0 ? "+" : ""}
          {formatCurrencyUSD(v)}
        </span>
      );
    },
  }),
  columnHelper.accessor("notes", {
    header: "Notas",
    cell: ({ getValue }) => {
      const notes = getValue();
      return notes ? (
        <span className="text-muted-foreground block max-w-[120px] truncate text-xs">{notes}</span>
      ) : (
        <span className="text-muted-foreground/50 text-xs">—</span>
      );
    },
    meta: { hideOnMobile: true },
  }),
  columnHelper.accessor("users.fullname", {
    header: "Usuario",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
    meta: { hideOnMobile: true },
  }),
] as ColumnDef<ReturnWithRelations>[];
