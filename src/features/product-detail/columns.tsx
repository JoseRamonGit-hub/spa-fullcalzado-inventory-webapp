import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { IterationCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { MovementStockChange } from "@/features/movements/components/movement-stock-change";
import { getMovementSignedQuantity, getMovementTypeInfo } from "@/features/movements/movement-presentation";
import { cn } from "@/lib/utils";
import type { ProductHistoryEvent } from "@/types";
import { formatCurrencyUSD, formatDate, formatTime } from "@/utils/formatters";

const columnHelper = createColumnHelper<ProductHistoryEvent>();

function MovementDetail({ event }: { event: ProductHistoryEvent }) {
  const typeInfo = getMovementTypeInfo(event);
  if (event.type !== "edit") return <span className="text-muted-foreground">{typeInfo.title}</span>;

  const hasDescriptionChange = event.description_before != null;
  const priceChange =
    event.price_usd_before != null && event.price_usd != null
      ? { before: event.price_usd_before, after: event.price_usd }
      : null;

  if (!hasDescriptionChange && !priceChange) {
    return <span className="text-muted-foreground">Ajuste de existencias</span>;
  }

  return (
    <span className="text-muted-foreground flex items-center gap-2">
      {hasDescriptionChange ? <span>Descripción editada</span> : null}
      {priceChange ? (
        <span>
          Precio: {formatCurrencyUSD(priceChange.before)} → {formatCurrencyUSD(priceChange.after)}
        </span>
      ) : null}
    </span>
  );
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
    cell: ({ row }) => <MovementDetail event={row.original} />,
  }),
  columnHelper.accessor("quantity", {
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ row }) => {
      const signedQuantity = getMovementSignedQuantity(row.original);
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
    cell: ({ row }) => <MovementStockChange movement={row.original} fallback="empty" showDelta={false} />,
  }),
  columnHelper.accessor("user_fullname", {
    header: "Usuario",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
] as ColumnDef<ProductHistoryEvent>[];
