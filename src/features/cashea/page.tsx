import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useDialogTarget } from "@/hooks/use-dialog-target";
import { DataTable } from "@/components/ui/data-table";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { Route } from "@/routes/_app/receivables/cashea";
import { formatCalendarDateString } from "@/utils/formatters";
import type { CalendarDateRange, CasheaOrder, CasheaOrdersFilter } from "@/types";
import { adminColumns, columns, type CasheaTableMeta } from "./columns";
import { Topbar } from "./components/topbar";
import { CasheaPendingSummary } from "./components/cashea-pending-summary";
import { AdjustCasheaOrderDialog } from "./components/adjust-cashea-order-dialog";
import { VoidCasheaOrderDialog } from "./components/void-cashea-order-dialog";
import { RegisterCasheaDepositDialog } from "./components/register-cashea-deposit-dialog";
import { RevertCasheaDepositDialog } from "./components/revert-cashea-deposit-dialog";
import { CasheaSelectionBar } from "./components/cashea-selection-bar";
import { useCasheaOrders } from "./hooks/useCasheaQueries";
import {
  casheaOrderStatusLabels,
  DEFAULT_CASHEA_STATUS_FILTER,
  resolveCasheaOrdersFilter,
  type CasheaStatusFilter,
} from "./cashea-receivables";

function getEmptyMessage(filter: CasheaOrdersFilter, hasRange: boolean) {
  const subject = filter.status
    ? `órdenes Cashea en estado ${casheaOrderStatusLabels[filter.status].toLowerCase()}`
    : "órdenes Cashea";

  if (hasRange) return `No hay ${subject} en el rango elegido.`;
  if (filter.from) return `No hay ${subject} desde el ${formatCalendarDateString(filter.from)}.`;
  return `No hay ${subject}.`;
}

export function CasheaPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/receivables/cashea" });
  const status = search.status ?? DEFAULT_CASHEA_STATUS_FILTER;
  const filter = resolveCasheaOrdersFilter(search);
  const hasRange = Boolean(search.from || search.to);

  const { data: orders, isLoading, isError, isFetching, refetch } = useCasheaOrders(filter);

  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const adjustDialog = useDialogTarget<CasheaOrder>();
  const voidDialog = useDialogTarget<CasheaOrder>();
  const depositDialog = useDialogTarget<CasheaOrder[]>();
  const revertDialog = useDialogTarget<string>();
  const [selectedOrderIds, setSelectedOrderIds] = useState<ReadonlySet<string>>(new Set());
  const selectedOrders = (orders ?? []).filter((order) => order.status === "pending" && selectedOrderIds.has(order.id));

  const selectOrders = (targets: CasheaOrder[], selected: boolean) => {
    setSelectedOrderIds((current) => {
      const next = new Set(current);
      for (const order of targets) {
        if (selected) next.add(order.id);
        else next.delete(order.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedOrderIds(new Set());

  const tableMeta: CasheaTableMeta = {
    isAdmin,
    selectedOrderIds,
    onSelectOrders: selectOrders,
    onCollectOrder: (order) => depositDialog.open([order]),
    onAdjustOrder: adjustDialog.open,
    onVoidOrder: voidDialog.open,
    onRevertDeposit: (order) => order.deposit_id && revertDialog.open(order.deposit_id),
  };

  const setStatus = (value: CasheaStatusFilter) => {
    clearSelection();
    navigate({ search: (prev) => ({ ...prev, status: value === DEFAULT_CASHEA_STATUS_FILTER ? undefined : value }) });
  };

  const setRange = (range: CalendarDateRange) => {
    clearSelection();
    navigate({ search: (prev) => ({ ...prev, from: range.from, to: range.to }) });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar status={status} from={search.from} to={search.to} onStatusChange={setStatus} onRangeChange={setRange} />
      {isLoading ? <MetricsSkeleton count={3} /> : orders ? <CasheaPendingSummary orders={orders} /> : null}
      {isAdmin && selectedOrders.length > 0 && (
        <CasheaSelectionBar
          orders={selectedOrders}
          onClear={clearSelection}
          onRegisterDeposit={() => depositDialog.open(selectedOrders)}
        />
      )}
      <DataTable
        columns={isAdmin ? adminColumns : columns}
        data={orders || []}
        isLoading={isLoading}
        errorState={
          isError && !orders
            ? { title: "No pudimos cargar las cuentas por cobrar Cashea", onRetry: refetch, isRetrying: isFetching }
            : undefined
        }
        getRowId={(row) => row.id}
        meta={tableMeta}
        emptyMessage={getEmptyMessage(filter, hasRange)}
        getRowAriaLabel={(row) => `Orden Cashea ${row.order_number}`}
        scrollAreaLabel="Cuentas por cobrar Cashea"
      />
      {adjustDialog.target && (
        <AdjustCasheaOrderDialog
          key={adjustDialog.key}
          isOpen={adjustDialog.isOpen}
          onOpenChange={adjustDialog.setIsOpen}
          order={adjustDialog.target}
        />
      )}
      {voidDialog.target && (
        <VoidCasheaOrderDialog
          key={voidDialog.key}
          isOpen={voidDialog.isOpen}
          onOpenChange={voidDialog.setIsOpen}
          order={voidDialog.target}
        />
      )}
      {depositDialog.target && (
        <RegisterCasheaDepositDialog
          key={depositDialog.key}
          isOpen={depositDialog.isOpen}
          onOpenChange={depositDialog.setIsOpen}
          orders={depositDialog.target}
          onRegistered={clearSelection}
        />
      )}
      {revertDialog.target && (
        <RevertCasheaDepositDialog
          key={revertDialog.key}
          isOpen={revertDialog.isOpen}
          onOpenChange={revertDialog.setIsOpen}
          depositId={revertDialog.target}
        />
      )}
    </section>
  );
}
