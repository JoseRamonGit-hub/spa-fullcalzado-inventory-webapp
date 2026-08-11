import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronRight, IterationCcw } from "lucide-react";
import type { ReturnWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { cn } from "@/lib/utils";
import { formatCurrencyUSD, formatCurrencyVES, formatDateTime } from "@/utils/formatters";
import { getReturnMovementTotals, getReturnOutcome } from "./return-display";

const columnHelper = createColumnHelper<ReturnWithRelations>();

function ReturnTypeBadge({ type }: Pick<ReturnWithRelations, "type">) {
  const isExchange = type === "exchange";

  return (
    <Badge variant={isExchange ? "exchange" : "refund"} title={isExchange ? "Cambio de artículo" : "Devolución"}>
      <IterationCcw aria-hidden="true" />
      {isExchange ? "Cambio" : "Devolución"}
    </Badge>
  );
}

function MovementTotals({ record }: { record: ReturnWithRelations }) {
  const movements = getReturnMovementTotals(record);

  return (
    <span className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
      <span>
        <span className="tabular-value">{movements.entries}</span> {movements.entries === 1 ? "entrada" : "entradas"}
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <span className="tabular-value">{movements.exits}</span> {movements.exits === 1 ? "salida" : "salidas"}
      </span>
    </span>
  );
}

function Outcome({ record }: { record: ReturnWithRelations }) {
  const outcome = getReturnOutcome(record);

  return (
    <div className="flex items-center gap-x-2">
      <span className="text-foreground text-xs font-medium">{outcome.label}</span>
      <span className={cn("data-value font-semibold", outcome.className)}>{formatCurrencyUSD(outcome.usd)}</span>
      <span className={cn("data-value font-semibold", outcome.className)}>{formatCurrencyVES(outcome.ves)}</span>
    </div>
  );
}

export const columns = [
  columnHelper.display({
    id: "expand",
    header: () => <span className="sr-only">Detalles</span>,
    cell: ({ row }) => (
      <span className="flex justify-center">
        <ChevronRight
          className={cn("text-muted-foreground size-4 transition-transform", row.getIsExpanded() && "rotate-90")}
          aria-hidden="true"
        />
      </span>
    ),
    size: 32,
  }),
  columnHelper.accessor("created_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha y hora" />,
    cell: ({ row }) => (
      <span className="tabular-value text-muted-foreground text-xs">
        {formatDateTime(row.original.created_at) || "—"}
      </span>
    ),
  }),
  columnHelper.accessor("type", {
    header: "Tipo",
    cell: ({ getValue }) => <ReturnTypeBadge type={getValue()} />,
  }),
  columnHelper.display({
    id: "movements",
    header: "Movimientos",
    cell: ({ row }) => <MovementTotals record={row.original} />,
  }),
  columnHelper.display({
    id: "outcome",
    header: "Resultado",
    cell: ({ row }) => <Outcome record={row.original} />,
  }),
  columnHelper.accessor("notes", {
    header: "Motivo",
    cell: ({ getValue }) => {
      const notes = getValue();
      return notes ? (
        <OverflowTooltip className="text-muted-foreground max-w-52 text-xs">{notes}</OverflowTooltip>
      ) : (
        <span className="text-muted-foreground/50 text-xs">—</span>
      );
    },
  }),
  columnHelper.accessor("users.fullname", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
    cell: ({ getValue }) => (
      <OverflowTooltip focusable={false} className="text-muted-foreground max-w-44">
        {getValue() || "—"}
      </OverflowTooltip>
    ),
  }),
] as ColumnDef<ReturnWithRelations>[];
