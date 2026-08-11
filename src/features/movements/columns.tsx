import type { InventoryMovementWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { formatCurrencyUSD, formatDateTime } from "@/utils/formatters";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { IterationCcw, Pencil } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { getMovementTypeInfo } from "./movement-presentation";
import { MovementStockChange } from "./components/movement-stock-change";

const columnHelper = createColumnHelper<InventoryMovementWithRelations>();

export const columns = [
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
  columnHelper.accessor("created_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha y hora" />,
    cell: ({ row }) => (
      <span className="data-value text-muted-foreground">{formatDateTime(row.original.created_at) || "—"}</span>
    ),
  }),
  columnHelper.accessor("products.code", {
    header: "Código",
    cell: ({ getValue }) => <span className="product-code uppercase">{getValue() || "—"}</span>,
  }),
  columnHelper.accessor("products.description", {
    header: "Descripción",
    cell: ({ getValue, row }) => {
      const description = getValue();
      const { type, description_before } = row.original;
      const hasDescriptionChange = type === "edit" && description_before != null;

      return (
        <span className="max-w-table-row flex items-center gap-1.5">
          <OverflowTooltip className="flex-1">{description || "—"}</OverflowTooltip>
          {hasDescriptionChange && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-edit focus-visible:ring-ring/50 shrink-0 rounded-sm p-0.5 outline-none focus-visible:ring-2"
                  aria-label="Ver descripción anterior"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs break-words">
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
  columnHelper.accessor("quantity", {
    header: () => <div className="text-right">Cantidad</div>,
    cell: ({ row }) => <MovementStockChange movement={row.original} />,
  }),
  columnHelper.display({
    id: "price",
    header: () => <div className="text-right">Precio USD</div>,
    cell: ({ row }) => {
      const { type, price_usd, price_usd_before } = row.original;

      if (price_usd == null) {
        return <span className="text-muted-foreground block text-right">—</span>;
      }

      // Edit with price change: show old → new
      if (type === "edit" && price_usd_before != null) {
        return (
          <div className="data-value flex items-center justify-end gap-1.5">
            <span className="text-muted-foreground text-[11px] line-through">
              {formatCurrencyUSD(price_usd_before)}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground font-medium">{formatCurrencyUSD(price_usd)}</span>
          </div>
        );
      }

      return <span className="data-value text-muted-foreground block text-right">{formatCurrencyUSD(price_usd)}</span>;
    },
  }),
  columnHelper.accessor("users.fullname", {
    header: "Usuario",
    cell: ({ getValue }) => (
      <OverflowTooltip focusable={false} className="text-muted-foreground max-w-44">
        {getValue() || "—"}
      </OverflowTooltip>
    ),
  }),
] as ColumnDef<InventoryMovementWithRelations>[];
