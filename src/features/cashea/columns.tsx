import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Ban, Check, Ellipsis, Pencil, Undo2 } from "lucide-react";
import type { CasheaOrder } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { narrowActionsColumn } from "@/components/ui/data-table-actions-column";
import { formatCalendarDateString, formatCurrencyUSD } from "@/utils/formatters";
import { formatCasheaAgeDays, getCasheaOrderAgeDays, isCasheaOrderLate } from "./cashea-receivables";
import { CasheaOrderStatusBadge } from "./components/cashea-order-status-badge";

const columnHelper = createColumnHelper<CasheaOrder>();

export type CasheaTableMeta = {
  isAdmin: boolean;
  selectedOrderIds: ReadonlySet<string>;
  onSelectOrders: (orders: CasheaOrder[], selected: boolean) => void;
  onCollectOrder: (order: CasheaOrder) => void;
  onAdjustOrder: (order: CasheaOrder) => void;
  onVoidOrder: (order: CasheaOrder) => void;
  onRevertDeposit: (order: CasheaOrder) => void;
};

function amountColumn(key: "total_usd" | "paid_today_usd" | "financed_usd" | "expected_net_usd", title: string) {
  return columnHelper.accessor(key, {
    enableSorting: true,
    meta: { align: "right" },
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
    cell: ({ getValue }) => <span className="data-value">{formatCurrencyUSD(getValue())}</span>,
  });
}

const selectColumn = columnHelper.display({
  id: "select",
  meta: { className: "w-10" },
  header: ({ table }) => {
    const meta = table.options.meta as CasheaTableMeta;
    const pendingOrders = table
      .getCoreRowModel()
      .rows.map((row) => row.original)
      .filter((order) => order.status === "pending");
    const selectedCount = pendingOrders.filter((order) => meta.selectedOrderIds.has(order.id)).length;
    const allSelected = pendingOrders.length > 0 && selectedCount === pendingOrders.length;

    return (
      <Checkbox
        aria-label="Seleccionar todas las órdenes pendientes"
        disabled={pendingOrders.length === 0}
        checked={allSelected ? true : selectedCount > 0 ? "indeterminate" : false}
        onCheckedChange={() => meta.onSelectOrders(pendingOrders, !allSelected)}
      />
    );
  },
  cell: ({ row, table }) => {
    const meta = table.options.meta as CasheaTableMeta;
    const order = row.original;
    if (order.status !== "pending") return null;

    return (
      <Checkbox
        aria-label={`Seleccionar la orden Cashea ${order.order_number}`}
        checked={meta.selectedOrderIds.has(order.id)}
        onCheckedChange={(checked) => meta.onSelectOrders([order], checked === true)}
      />
    );
  },
});

const dataColumns = [
  columnHelper.accessor("order_number", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Orden" />,
    cell: ({ getValue }) => <span className="product-code">{getValue()}</span>,
  }),
  columnHelper.accessor("invoice_number", {
    header: "Factura",
    cell: ({ getValue }) => <span className="product-code text-muted-foreground">{getValue()}</span>,
  }),
  columnHelper.accessor("sale_date", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ getValue }) => (
      <span className="tabular-value text-muted-foreground">{formatCalendarDateString(getValue()) || "—"}</span>
    ),
  }),
  amountColumn("total_usd", "Total"),
  amountColumn("paid_today_usd", "Inicial"),
  amountColumn("financed_usd", "Monto financiado"),
  amountColumn("expected_net_usd", "Neto esperado"),
];

const statusColumn = columnHelper.accessor("status", {
  header: () => <div className="text-center">Estado</div>,
  cell: ({ getValue }) => {
    return (
      <span className="flex justify-center">
        <CasheaOrderStatusBadge status={getValue()} />
      </span>
    );
  },
});

const ageColumn = columnHelper.accessor((order) => getCasheaOrderAgeDays(order.sale_date), {
  id: "age",
  enableSorting: true,
  meta: { align: "right" },
  header: ({ column }) => <DataTableColumnHeader column={column} title="Antigüedad" />,
  cell: ({ getValue, row }) => {
    const ageDays = getValue();
    const label = formatCasheaAgeDays(ageDays);

    return (
      <span className="tabular-value text-muted-foreground">
        {isCasheaOrderLate(row.original, ageDays) ? <Badge variant="warning">{label}</Badge> : label}
      </span>
    );
  },
});

const actionsColumn = narrowActionsColumn<CasheaOrder, CasheaTableMeta>((order, meta) =>
  meta.isAdmin && order.status !== "voided" ? <OrderActions order={order} meta={meta} /> : null,
);

type CasheaColumnsOptions = {
  /** Casillas para Registrar depósito y menú de acciones. */
  isAdmin: boolean;
};

export function getCasheaColumns({ isAdmin }: CasheaColumnsOptions) {
  return [
    ...(isAdmin ? [selectColumn] : []),
    ...dataColumns,
    statusColumn,
    ageColumn,
    actionsColumn,
  ] as ColumnDef<CasheaOrder>[];
}

function OrderActions({ order, meta }: { order: CasheaOrder; meta: CasheaTableMeta }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Acciones de la orden Cashea ${order.order_number}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {order.status === "collected" ? (
          <DropdownMenuItem variant="destructive" onSelect={() => meta.onRevertDeposit(order)}>
            <Undo2 aria-hidden="true" />
            Revertir depósito
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onSelect={() => meta.onCollectOrder(order)}>
              <Check aria-hidden="true" />
              Cobrar orden
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => meta.onAdjustOrder(order)}>
              <Pencil aria-hidden="true" />
              Ajustar orden
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => meta.onVoidOrder(order)}>
              <Ban aria-hidden="true" />
              Anular orden
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
