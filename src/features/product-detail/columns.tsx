import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { IterationCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { MovementStockChange } from "@/features/movements/components/movement-stock-change";
import { getMovementSignedQuantity, getMovementTypeInfo } from "@/features/movements/movement-presentation";
import { cn } from "@/lib/utils";
import type { ProductHistoryEvent } from "@/types";
import { formatCurrencyUSD, formatDateTime } from "@/utils/formatters";

const columnHelper = createColumnHelper<ProductHistoryEvent>();

function MovementContext({ event }: { event: ProductHistoryEvent }) {
  if (event.type === "entry") return <span className="text-muted-foreground">Inventario</span>;
  if (event.type === "return") return <span className="text-muted-foreground">Devolución</span>;
  if (event.type === "exit") {
    return <span className="text-muted-foreground">{event.return_id ? "Cambio" : "Venta"}</span>;
  }
  if (event.type === "activation" || event.type === "deactivation") return null;

  if (event.adjustment_reason) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="text-foreground shrink-0 font-medium">Existencias</span>
        <span className="text-muted-foreground" aria-hidden="true">
          ·
        </span>
        <OverflowTooltip className="text-muted-foreground max-w-72">{event.adjustment_reason}</OverflowTooltip>
      </span>
    );
  }

  const hasDescriptionChange = event.description_before != null;
  const priceChange =
    event.price_usd_before != null && event.price_usd != null
      ? { before: event.price_usd_before, after: event.price_usd }
      : null;

  if (!hasDescriptionChange && !priceChange) {
    return <span className="text-muted-foreground">Existencias</span>;
  }

  return (
    <span className="text-muted-foreground flex items-center gap-1.5">
      {hasDescriptionChange ? <span>Descripción</span> : null}
      {hasDescriptionChange && priceChange ? <span aria-hidden="true">·</span> : null}
      {priceChange ? (
        <span>
          {formatCurrencyUSD(priceChange.before)} → {formatCurrencyUSD(priceChange.after)}
        </span>
      ) : null}
    </span>
  );
}

export const productHistoryColumns = [
  columnHelper.display({
    id: "movement",
    header: "Movimiento",
    cell: ({ row }) => {
      const { variant, label, title, showReturnIcon } = getMovementTypeInfo(row.original);
      return (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant={variant} title={title}>
              {showReturnIcon ? <IterationCcw aria-hidden="true" /> : null}
              {label}
            </Badge>
            <MovementContext event={row.original} />
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("created_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha y hora" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatDateTime(row.original.created_at) || "—"}</span>
    ),
  }),
  columnHelper.accessor("quantity", {
    header: () => <div className="text-right">Cantidad</div>,
    cell: ({ row }) => {
      const signedQuantity = getMovementSignedQuantity(row.original);
      if (signedQuantity == null || signedQuantity === 0) {
        return <span className="text-muted-foreground block text-right">—</span>;
      }

      return (
        <span
          className={cn(
            "block text-right font-medium tabular-nums",
            signedQuantity > 0 ? "text-success" : "text-destructive",
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
    cell: ({ getValue }) => (
      <OverflowTooltip focusable={false} className="text-muted-foreground max-w-44">
        {getValue() || "—"}
      </OverflowTooltip>
    ),
  }),
] as ColumnDef<ProductHistoryEvent>[];
