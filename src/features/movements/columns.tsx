import type { InventoryMovementWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, formatCurrencyUSD } from "@/utils/formatters";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const columHelper = createColumnHelper<InventoryMovementWithRelations>();

function getTypeInfo(movement: InventoryMovementWithRelations) {
  const { type, return_id } = movement;
  const isExchangeExit = type === "exit" && return_id;

  if (type === "entry") return { variant: "success" as const, label: "Entrada" };
  if (type === "return") return { variant: "refund" as const, label: "Devolución" };
  if (type === "edit") return { variant: "edit" as const, label: "Edición" };
  if (isExchangeExit) return { variant: "exchange" as const, label: "Cambio" };
  return { variant: "destructive" as const, label: "Salida" };
}

export const columns = [
  columHelper.accessor("type", {
    header: () => <div className="text-center">Tipo</div>,
    cell: ({ row }) => {
      const { variant, label } = getTypeInfo(row.original);
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
    cell: ({ getValue, row }) => {
      const description = getValue();
      const { type, description_before } = row.original;
      const hasDescriptionChange = type === "edit" && description_before != null;

      return (
        <span className="max-w-table-row flex items-center gap-1.5">
          <span className="block truncate">{description}</span>
          {hasDescriptionChange && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-edit shrink-0">
                  <Pencil className="size-3" aria-hidden="true" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-muted-foreground text-[11px]">
                  Antes: <span className="text-white">{description_before}</span>
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      );
    },
  }),
  columHelper.accessor("quantity", {
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ getValue, row }) => {
      const { type, stock_before } = row.original;
      const quantity = getValue();

      // Edit type: quantity is the signed diff (can be negative, zero, or positive)
      if (type === "edit" && stock_before != null) {
        if (quantity === 0) {
          return <span className="text-muted-foreground block text-right tabular-nums">{stock_before}</span>;
        }
        const stockAfter = stock_before + quantity;
        const isIncrease = quantity > 0;
        const sign = isIncrease ? "+" : "";

        return (
          <div className="flex items-center justify-end gap-1.5 tabular-nums">
            <span className="text-muted-foreground">{stock_before}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground font-medium">{stockAfter}</span>
            <span
              className={cn("hidden text-[10px] md:inline-block", isIncrease ? "text-emerald-500" : "text-red-500")}
            >
              ({sign}
              {quantity})
            </span>
          </div>
        );
      }

      // Entry/return/exit with stock_before available → show "before → after (+delta)"
      if (stock_before != null) {
        const isInflow = type === "entry" || type === "return";
        const stockAfter = isInflow ? stock_before + quantity : stock_before - quantity;
        const sign = isInflow ? "+" : "−";

        return (
          <div className="flex items-center justify-end gap-1.5 tabular-nums">
            <span className="text-muted-foreground">{stock_before}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground font-medium">{stockAfter}</span>
            <span className={cn("hidden text-[10px] md:inline-block", isInflow ? "text-emerald-500" : "text-red-500")}>
              ({sign}
              {quantity})
            </span>
          </div>
        );
      }

      // Fallback for historical data without stock_before
      const isInflow = type === "entry" || type === "return";
      const sign = isInflow ? "+" : "−";

      return (
        <span className="flex items-center justify-end gap-1">
          <span className={cn("text-[10px] font-semibold", isInflow ? "text-emerald-500" : "text-red-500")}>
            {sign}
          </span>
          <span className="font-medium tabular-nums">{quantity}</span>
        </span>
      );
    },
  }),
  columHelper.display({
    id: "price",
    header: () => <div className="text-right">Precio</div>,
    cell: ({ row }) => {
      const { type, price_usd, price_usd_before } = row.original;

      if (price_usd == null) {
        return <span className="text-muted-foreground block text-right">—</span>;
      }

      // Edit with price change: show old → new
      if (type === "edit" && price_usd_before != null) {
        return (
          <div className="flex items-center justify-end gap-1.5 tabular-nums">
            <span className="text-muted-foreground text-[11px] line-through">
              {formatCurrencyUSD(price_usd_before)}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground font-medium">{formatCurrencyUSD(price_usd)}</span>
          </div>
        );
      }

      return (
        <span className="text-muted-foreground block text-right tabular-nums">{formatCurrencyUSD(price_usd)}</span>
      );
    },
    meta: { hideOnMobile: true },
  }),
  columHelper.accessor("users.fullname", {
    header: "Usuario",
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
] as ColumnDef<InventoryMovementWithRelations>[];
