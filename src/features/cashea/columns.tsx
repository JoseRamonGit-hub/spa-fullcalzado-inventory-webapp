import { CasheaOrderNumber } from "@/features/cashea/components/cashea-order-number";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Ban, Check, Pencil, Undo2 } from "lucide-react";
import type { CasheaOrder } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyUSD, formatDateTime } from "@/utils/formatters";
import { formatCasheaAgeDays, getCasheaOrderAgeDays, isCasheaOrderLate } from "./cashea-receivables";
import { CasheaOrderStatusBadge } from "./components/cashea-order-status-badge";

const columnHelper = createColumnHelper<CasheaOrder>();

export type CasheaTableMeta = {
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
    cell: ({ getValue }) => (
      <span className={key === "paid_today_usd" ? "data-value font-bold" : "data-value"}>
        {formatCurrencyUSD(getValue())}
      </span>
    ),
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
    cell: ({ getValue }) => <CasheaOrderNumber value={getValue()} />,
  }),
  columnHelper.accessor("invoice_number", {
    header: "Factura",
    cell: ({ getValue }) => <span className="product-code text-muted-foreground">{getValue()}</span>,
  }),
  columnHelper.accessor("created_at", {
    enableSorting: true,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha y hora" />,
    cell: ({ getValue }) => (
      <span className="tabular-value text-muted-foreground text-xs">{formatDateTime(getValue()) || "—"}</span>
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

const actionsColumn = columnHelper.display({
  id: "actions",
  header: "Acciones",
  meta: { align: "center", hideOnMobile: true },
  cell: ({ row, table }) => {
    const order = row.original;
    const meta = table.options.meta as CasheaTableMeta;

    return order.status === "voided" ? null : <OrderActions order={order} meta={meta} />;
  },
});

type CasheaColumnsOptions = {
  /** Casillas para Registrar depósito y columna de acciones. */
  isAdmin: boolean;
};

export function getCasheaColumns({ isAdmin }: CasheaColumnsOptions) {
  return [
    ...(isAdmin ? [selectColumn] : []),
    ...dataColumns,
    statusColumn,
    ageColumn,
    ...(isAdmin ? [actionsColumn] : []),
  ] as ColumnDef<CasheaOrder>[];
}

function OrderActions({ order, meta }: { order: CasheaOrder; meta: CasheaTableMeta }) {
  const orderLabel = `orden Cashea ${order.order_number}`;

  return (
    <div className="flex items-center justify-center gap-1">
      {order.status === "collected" ? (
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Revertir depósito de la ${orderLabel}`}
          title="Revertir depósito"
          onClick={() => meta.onRevertDeposit(order)}
        >
          <Undo2 data-icon="inline-start" aria-hidden="true" />
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-primary"
            aria-label={`Cobrar ${orderLabel}`}
            title="Cobrar orden"
            onClick={() => meta.onCollectOrder(order)}
          >
            <Check data-icon="inline-start" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-primary"
            aria-label={`Ajustar ${orderLabel}`}
            title="Ajustar orden"
            onClick={() => meta.onAdjustOrder(order)}
          >
            <Pencil data-icon="inline-start" aria-hidden="true" />
          </Button>
          <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Anular ${orderLabel}`}
            title="Anular orden"
            onClick={() => meta.onVoidOrder(order)}
          >
            <Ban data-icon="inline-start" aria-hidden="true" />
          </Button>
        </>
      )}
    </div>
  );
}
