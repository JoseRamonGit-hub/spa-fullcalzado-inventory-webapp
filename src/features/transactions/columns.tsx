import { createColumnHelper, type ColumnDef, type Row } from "@tanstack/react-table";
import type { TransactionWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { narrowActionsColumn } from "@/components/ui/data-table-actions-column";
import { OverflowTooltip } from "@/components/ui/overflow-tooltip";
import { formatCurrencyUSD, formatCurrencyVES, formatDateForBackend, formatDateTime } from "@/utils/formatters";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, IterationCcw } from "lucide-react";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";
import { Button } from "@/components/ui/button";
import { getActiveCasheaOrder, type SaleTableRow } from "./sales-display";

const columnHelper = createColumnHelper<SaleTableRow>();

export function saleRowClassName(row: Row<SaleTableRow>) {
  if (row.depth) {
    return "sale-line bg-card hover:bg-table-hover border-transparent [&>td]:h-7 [&>td]:text-xs";
  }
  if (row.getIsExpanded()) {
    return "border-border/60";
  }
}

export type TransactionsTableMeta = {
  canAttachCasheaOrder: (transaction: TransactionWithRelations) => boolean;
  onAttachCasheaOrder: (saleId: string) => void;
};

export const columns = [
  columnHelper.display({
    id: "expand",
    meta: { className: "w-8 px-0" },
    header: () => <span className="sr-only">Detalle</span>,
    cell: ({ row }) =>
      row.getCanExpand() && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground ml-1"
          aria-label={`${row.getIsExpanded() ? "Ocultar" : "Ver"} ${row.original.products.description}`}
          aria-expanded={row.getIsExpanded()}
          onClick={row.getToggleExpandedHandler()}
        >
          <ChevronRight aria-hidden="true" className={row.getIsExpanded() ? "rotate-90" : undefined} />
        </Button>
      ),
  }),
  columnHelper.accessor("created_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha y hora" />,
    cell: ({ row }) =>
      row.depth ? null : (
        <span className="tabular-value text-muted-foreground text-xs">
          {formatDateTime(row.original.created_at) || "—"}
        </span>
      ),
  }),
  columnHelper.accessor("products.code", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
    cell: ({ getValue, row }) => {
      const isExchange = !!row.original.return_id;
      const exchangeDate = formatDateForBackend(row.original.created_at);
      const returnId = row.original.return_id;
      const casheaOrder = row.depth ? null : getActiveCasheaOrder(row.original);

      return (
        <span className="relative flex items-center gap-1.5">
          {row.depth > 0 && <span aria-hidden="true" className="sale-line-branch" />}
          {row.original.lines && getValue() === "Varios" ? (
            <span className="text-muted-foreground text-xs">Varios</span>
          ) : (
            <OverflowTooltip className="product-code max-w-36 uppercase">{getValue() || "—"}</OverflowTooltip>
          )}
          {isExchange && returnId && <ExchangeBadge date={exchangeDate} returnId={returnId} />}
          {casheaOrder && <CasheaOrderLink orderId={casheaOrder.id} orderNumber={casheaOrder.order_number} />}
        </span>
      );
    },
  }),
  columnHelper.accessor("products.description", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
    cell: ({ getValue, row }) =>
      row.original.lines ? (
        <span className="text-muted-foreground text-xs">{row.getIsExpanded() ? null : getValue()}</span>
      ) : (
        <OverflowTooltip className="max-w-table-row">{getValue() || "—"}</OverflowTooltip>
      ),
  }),
  columnHelper.accessor("quantity", {
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cantidad" />,
    cell: ({ getValue, row }) => (
      <span className={row.depth ? "tabular-value text-muted-foreground" : "tabular-value"}>{getValue()}</span>
    ),
  }),
  columnHelper.accessor("total_usd", {
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="USD" />,
    cell: ({ getValue, row }) => {
      const value = getValue();
      return (
        <span className={row.depth ? "data-value text-muted-foreground" : "data-value font-medium"}>
          {value == null ? "—" : formatCurrencyUSD(value)}
        </span>
      );
    },
  }),
  columnHelper.accessor("total_ves", {
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bs." />,
    cell: ({ getValue }) => {
      const value = getValue();
      return <span className="data-value text-muted-foreground">{value == null ? "—" : formatCurrencyVES(value)}</span>;
    },
  }),
  columnHelper.accessor("exchange_rate", {
    header: () => <div className="text-right">Tasa</div>,
    cell: ({ getValue, row }) =>
      row.depth ? null : (
        <span className="data-value text-muted-foreground block text-right text-xs">
          {formatCurrencyVES(getValue())}
        </span>
      ),
  }),
  columnHelper.accessor("users.fullname", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendedor" />,
    cell: ({ getValue, row }) =>
      row.depth ? null : (
        <OverflowTooltip focusable={false} className="text-muted-foreground max-w-44">
          {getValue() || "—"}
        </OverflowTooltip>
      ),
  }),
  narrowActionsColumn<SaleTableRow, TransactionsTableMeta>((transaction, meta, row) => {
    const { sale_id: saleId } = transaction;
    if (row.depth || !saleId || !meta.canAttachCasheaOrder(transaction)) return null;

    return <AttachCasheaOrderButton onClick={() => meta.onAttachCasheaOrder(saleId)} />;
  }),
] as ColumnDef<SaleTableRow>[];

// ── Internal component: navigable exchange badge ────────────
function ExchangeBadge({ date, returnId }: { date: string; returnId: string }) {
  const navigate = useNavigate();

  return (
    <Badge asChild variant="exchange" className="px-1.5 py-0 text-[11px] transition-opacity hover:opacity-80">
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

function CasheaOrderLink({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const label = `Ver orden Cashea ${orderNumber}`;
  return (
    <Badge asChild variant="outline" className="px-1.5 py-0 text-[11px]">
      <Link to="/receivables/cashea" search={{ orderId, onlyOrder: true }} title={label} aria-label={label}>
        <CasheaLogoIcon className="size-3 rounded-[3px]" />
        Cashea
      </Link>
    </Badge>
  );
}

// ── Internal component: «Asociar orden Cashea» action ───────
function AttachCasheaOrderButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0 focus-visible:opacity-100 focus-visible:grayscale-0"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label="Asociar orden Cashea"
      title="Asociar orden Cashea"
    >
      <CasheaLogoIcon />
    </Button>
  );
}
