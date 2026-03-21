import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { TransactionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { formatTime, formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";
import { useNavigate } from "@tanstack/react-router";

const columnHelper = createColumnHelper<TransactionWithRelations>();

export const columns = [
  columnHelper.accessor("date", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatDate(row.original.created_at)}</span>,
  }),
  columnHelper.accessor("time", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hora" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatTime(row.original.created_at)}</span>
    ),
  }),
  columnHelper.accessor("products.code", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
    cell: ({ getValue, row }) => {
      const isExchange = !!row.original.return_id;
      return (
        <span className="flex items-center gap-1.5">
          <span className="product-code font-bold uppercase">{getValue()}</span>
          {isExchange && <ExchangeBadge />}
        </span>
      );
    },
  }),
  columnHelper.accessor("products.description", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ getValue }) => <span className="max-w-table-row block truncate">{getValue()}</span>,
  }),
  columnHelper.accessor("quantity", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cant." className="justify-end" />,
    cell: ({ getValue }) => <span className="block text-right font-medium tabular-nums">{getValue()}</span>,
  }),
  columnHelper.accessor("total_usd", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="USD" className="justify-end" />,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyUSD(getValue() ?? 0)}</span>
    ),
  }),
  columnHelper.accessor("total_ves", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="VES" className="justify-end" />,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground block text-right tabular-nums">{formatCurrencyVES(getValue() ?? 0)}</span>
    ),
  }),
  columnHelper.accessor("exchange_rate", {
    header: "Tasa",
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatCurrencyVES(getValue())}</span>,
  }),
  columnHelper.accessor("users.fullname", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendedor" />,
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
  }),
] as ColumnDef<TransactionWithRelations>[];

// ── Internal component: navigable exchange badge ────────────
function ExchangeBadge() {
  const navigate = useNavigate();

  return (
    <Badge
      variant="exchange"
      className="cursor-pointer px-1.5 py-0 text-[10px] transition-opacity hover:opacity-80"
      onClick={(e) => {
        e.stopPropagation();
        navigate({ to: "/returns" });
      }}
      title="Ver en módulo de devoluciones"
    >
      Cambio ↗
    </Badge>
  );
}
