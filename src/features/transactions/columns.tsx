import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { TransactionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD, formatCurrencyVES, formatDateForBackend, formatDateTime } from "@/utils/formatters";
import { useNavigate } from "@tanstack/react-router";
import { IterationCcw } from "lucide-react";

const columnHelper = createColumnHelper<TransactionWithRelations>();

export const columns = [
  columnHelper.accessor("created_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha y hora" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatDateTime(row.original.created_at) || "—"}</span>
    ),
  }),
  columnHelper.accessor("products.code", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
    cell: ({ getValue, row }) => {
      const isExchange = !!row.original.return_id;
      const exchangeDate = formatDateForBackend(row.original.created_at);
      const returnId = row.original.return_id;

      return (
        <span className="flex items-center gap-1.5">
          <span className="product-code font-bold uppercase">{getValue() || "—"}</span>
          {isExchange && returnId && <ExchangeBadge date={exchangeDate} returnId={returnId} />}
        </span>
      );
    },
  }),
  columnHelper.accessor("products.description", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ getValue }) => <OverflowTooltip className="max-w-table-row">{getValue() || "—"}</OverflowTooltip>,
  }),
  columnHelper.accessor("quantity", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cantidad" className="justify-end" />,
    cell: ({ getValue }) => <span className="block text-right font-medium tabular-nums">{getValue()}</span>,
  }),
  columnHelper.accessor("total_usd", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="USD" className="justify-end" />,
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <span className="block text-right font-medium tabular-nums">
          {value == null ? "—" : formatCurrencyUSD(value)}
        </span>
      );
    },
  }),
  columnHelper.accessor("total_ves", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bs." className="justify-end" />,
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <span className="text-muted-foreground block text-right tabular-nums">
          {value == null ? "—" : formatCurrencyVES(value)}
        </span>
      );
    },
  }),
  columnHelper.accessor("exchange_rate", {
    header: "Tasa",
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatCurrencyVES(getValue())}</span>,
  }),
  columnHelper.accessor("users.fullname", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendedor" />,
    cell: ({ getValue }) => (
      <OverflowTooltip focusable={false} className="text-muted-foreground max-w-44">
        {getValue() || "—"}
      </OverflowTooltip>
    ),
  }),
] as ColumnDef<TransactionWithRelations>[];

// ── Internal component: navigable exchange badge ────────────
function ExchangeBadge({ date, returnId }: { date: string; returnId: string }) {
  const navigate = useNavigate();

  return (
    <Badge asChild variant="exchange" className="px-1.5 py-0 text-[10px] transition-opacity hover:opacity-80">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          navigate({ to: "/returns", search: { date, returnId } });
        }}
        aria-label="Ver devolución vinculada"
        title={`Ver devolución vinculada del ${date}`}
      >
        <IterationCcw aria-hidden="true" />
        Devolución
      </button>
    </Badge>
  );
}
