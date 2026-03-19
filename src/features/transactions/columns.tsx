import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { TransactionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatTime, formatCurrencyUSD, formatCurrencyVES, formatDate } from "@/utils/formatters";
import { useNavigate } from "@tanstack/react-router";

const columnHelper = createColumnHelper<TransactionWithRelations>();

export const columns = [
  columnHelper.accessor("date", {
    header: "Fecha",
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatDate(row.original.created_at)}</span>,
  }),
  columnHelper.accessor("time", {
    header: "Hora",
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatTime(row.original.created_at)}</span>
    ),
  }),
  columnHelper.accessor("products.code", {
    header: "Código",
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
    header: "Descripción",
    cell: ({ getValue }) => <span className="max-w-table-row block truncate">{getValue()}</span>,
  }),
  columnHelper.accessor("quantity", {
    header: () => <div className="text-right">Cant.</div>,
    cell: ({ getValue }) => <span className="block text-right font-medium tabular-nums">{getValue()}</span>,
  }),
  columnHelper.accessor("total_usd", {
    header: () => <div className="text-right">USD</div>,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">{formatCurrencyUSD(getValue() ?? 0)}</span>
    ),
  }),
  columnHelper.accessor("total_ves", {
    header: () => <div className="text-right">VES</div>,
    cell: ({ getValue }) => (
      <span className="text-muted-foreground block text-right tabular-nums">{formatCurrencyVES(getValue() ?? 0)}</span>
    ),
  }),
  columnHelper.accessor("exchange_rate", {
    header: "Tasa",
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatCurrencyVES(getValue())}</span>,
  }),
  columnHelper.accessor("users.fullname", {
    header: "Vendedor",
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
