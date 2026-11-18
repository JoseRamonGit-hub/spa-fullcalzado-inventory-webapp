import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Ban, Check, Ellipsis, Pencil, Undo2 } from "lucide-react";
import type { CasheaOrder, CasheaOrderStatus } from "@/types";
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
import { casheaOrderStatusLabels, formatCasheaAgeDays, getCasheaOrderAgeDays } from "./cashea-receivables";

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

const statusBadgeVariants: Record<CasheaOrderStatus, "warning" | "success" | "secondary"> = {
  pending: "warning",
  collected: "success",
  voided: "secondary",
};

function amountColumn(key: "total_usd" | "paid_today_usd" | "financed_usd" | "expected_net_usd", title: string) {
  return columnHelper.accessor(key, {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title={title} className="justify-end" />,
    cell: ({ getValue }) => <span className="data-value block text-right">{formatCurrencyUSD(getValue())}</span>,
  });
}

export const columns = [
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
  amountColumn("paid_today_usd", "Cobrado hoy"),
  amountColumn("financed_usd", "Monto financiado"),
  amountColumn("expected_net_usd", "Neto esperado"),
  columnHelper.accessor("status", {
    header: () => <div className="text-center">Estado</div>,
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <span className="flex justify-center">
          <Badge variant={statusBadgeVariants[status]}>{casheaOrderStatusLabels[status]}</Badge>
        </span>
      );
    },
  }),
  columnHelper.accessor((order) => getCasheaOrderAgeDays(order.sale_date), {
    id: "age",
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Antigüedad" className="justify-end" />,
    cell: ({ getValue }) => (
      <span className="tabular-value text-muted-foreground block text-right">{formatCasheaAgeDays(getValue())}</span>
    ),
  }),
  narrowActionsColumn<CasheaOrder, CasheaTableMeta>((order, meta) =>
    meta.isAdmin && order.status !== "voided" ? <OrderActions order={order} meta={meta} /> : null,
  ),
] as ColumnDef<CasheaOrder>[];

export const adminColumns = [
  columnHelper.display({
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
  }),
  ...columns,
] as ColumnDef<CasheaOrder>[];

function OrderActions({ order, meta }: { order: CasheaOrder; meta: CasheaTableMeta }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones de la orden Cashea ${order.order_number}`}>
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
