import { useDeferredValue, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useDialogTarget } from "@/hooks/use-dialog-target";
import { DataTable } from "@/components/ui/data-table";
import { Route } from "@/routes/_app/receivables/cashea";
import { formatCalendarDateString } from "@/utils/formatters";
import type { CalendarDateRange, CasheaOrder, CasheaOrdersFilter } from "@/types";
import { getCasheaColumns, type CasheaTableMeta } from "./columns";
import { Topbar } from "./components/topbar";
import { CasheaPendingSummary } from "./components/cashea-pending-summary";
import { CasheaListFooter } from "./components/cashea-list-footer";
import { CasheaOrderSheet, type CasheaOrderActions } from "./components/cashea-order-sheet";
import { AdjustCasheaOrderDialog } from "./components/adjust-cashea-order-dialog";
import { VoidCasheaOrderDialog } from "./components/void-cashea-order-dialog";
import { RegisterCasheaDepositDialog } from "./components/register-cashea-deposit-dialog";
import { RevertCasheaDepositDialog } from "./components/revert-cashea-deposit-dialog";
import {
  useCasheaOrder,
  useCasheaOrderCounts,
  useCasheaOrders,
  useCasheaOrdersForCashClose,
} from "./hooks/useCasheaQueries";
import {
  casheaOrderStatusLabels,
  DEFAULT_CASHEA_STATUS_FILTER,
  resolveCasheaOrdersFilter,
  searchCasheaOrders,
  type CasheaStatusFilter,
} from "./cashea-receivables";

function getEmptyMessage(filter: CasheaOrdersFilter, hasRange: boolean, search: string) {
  if (search.trim()) return `Ninguna orden o factura coincide con «${search.trim()}».`;

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
  const onlyOrder = Boolean(search.orderId && search.onlyOrder);
  const isOrderSheetOpen = Boolean(search.orderId) && !(onlyOrder && search.sheet === "closed");
  const status = search.status ?? DEFAULT_CASHEA_STATUS_FILTER;
  const range: CalendarDateRange = { from: search.from, to: search.to };
  const filter = resolveCasheaOrdersFilter(search);
  const hasRange = Boolean(search.from || search.to);
  const ledgerDate = !onlyOrder && search.cashClose && search.from === search.to ? search.from : undefined;
  const closedAt = search.cashClose === "day" ? undefined : search.cashClose;

  const ordersQuery = useCasheaOrders(filter, !onlyOrder && !ledgerDate);
  const ledgerQuery = useCasheaOrdersForCashClose(ledgerDate, closedAt);
  const listQuery = ledgerDate ? ledgerQuery : ordersQuery;
  const { data } = listQuery;
  const { data: rangeCounts } = useCasheaOrderCounts(range, !ledgerDate);
  const listOrder = !onlyOrder && search.orderId ? data?.find((order) => order.id === search.orderId) : undefined;
  const orderQuery = useCasheaOrder(search.orderId, listOrder);
  const sheetOrder = orderQuery.data ?? null;
  const tableQuery = onlyOrder ? orderQuery : listQuery;
  const tableError = tableQuery.isError && !tableQuery.data;
  const orders = ledgerDate && status !== "all" ? data?.filter((order) => order.status === status) : data;
  const statusCounts = ledgerDate
    ? data?.reduce(
        (counts, order) => {
          counts[order.status]++;
          counts.all++;
          return counts;
        },
        { pending: 0, collected: 0, voided: 0, all: 0 },
      )
    : rangeCounts;

  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const visibleOrders = onlyOrder ? (sheetOrder ? [sheetOrder] : []) : searchCasheaOrders(orders ?? [], deferredSearch);

  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const adjustDialog = useDialogTarget<CasheaOrder>();
  const voidDialog = useDialogTarget<CasheaOrder>();
  const depositDialog = useDialogTarget<CasheaOrder[]>();
  const revertDialog = useDialogTarget<string>();
  const [selectedOrderIds, setSelectedOrderIds] = useState<ReadonlySet<string>>(new Set());
  const selectedOrders = visibleOrders.filter((order) => order.status === "pending" && selectedOrderIds.has(order.id));

  const setOrderSheetOpen = (isOpen: boolean) => {
    if (!isOpen && search.orderId) {
      return navigate({
        replace: true,
        resetScroll: false,
        search: (prev) =>
          onlyOrder
            ? { ...prev, sheet: "closed" }
            : { ...prev, orderId: undefined, onlyOrder: undefined, sheet: undefined },
      });
    }
  };

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

  const clearFilters = () => {
    clearSelection();
    setSearchInput("");
    navigate({ replace: true, search: {} });
  };

  const orderActions: CasheaOrderActions = {
    onCollectOrder: (order) => depositDialog.open([order]),
    onAdjustOrder: adjustDialog.open,
    onVoidOrder: voidDialog.open,
    onRevertDeposit: (order) => order.deposit_id && revertDialog.open(order.deposit_id),
  };

  const tableMeta: CasheaTableMeta = {
    selectedOrderIds,
    onSelectOrders: selectOrders,
    ...orderActions,
  };

  const setStatus = (value: CasheaStatusFilter) => {
    clearSelection();
    navigate({ search: (prev) => ({ ...prev, status: value === DEFAULT_CASHEA_STATUS_FILTER ? undefined : value }) });
  };

  const setRange = (nextRange: CalendarDateRange) => {
    clearSelection();
    navigate({ search: (prev) => ({ ...prev, from: nextRange.from, to: nextRange.to, cashClose: undefined }) });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar
        onlyOrder={onlyOrder}
        onClearFilters={clearFilters}
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        statusCounts={statusCounts}
        from={search.from}
        to={search.to}
        onStatusChange={setStatus}
        onRangeChange={setRange}
      />
      <CasheaPendingSummary />
      <DataTable
        columns={getCasheaColumns({ isAdmin })}
        data={visibleOrders}
        isLoading={tableQuery.isLoading}
        errorState={
          tableError
            ? {
                title: onlyOrder
                  ? "No pudimos cargar la orden Cashea"
                  : "No pudimos cargar las cuentas por cobrar Cashea",
                onRetry: tableQuery.refetch,
                isRetrying: tableQuery.isFetching,
              }
            : undefined
        }
        getRowId={(row) => row.id}
        meta={tableMeta}
        emptyMessage={
          onlyOrder
            ? "No encontramos la orden en el negocio activo."
            : getEmptyMessage(filter, hasRange, deferredSearch)
        }
        onRowClick={(order) =>
          navigate({
            replace: onlyOrder,
            resetScroll: false,
            search: (prev) => ({ ...prev, orderId: order.id, sheet: undefined }),
          })
        }
        getRowAriaLabel={(row) => `Ver detalle de la orden Cashea ${row.order_number}`}
        getRowClassName={(row) => (selectedOrderIds.has(row.id) ? "bg-primary/5 hover:bg-primary/8" : undefined)}
        scrollAreaLabel="Cuentas por cobrar Cashea"
      />
      {!tableError && (
        <CasheaListFooter
          orders={visibleOrders}
          selectedOrders={isAdmin ? selectedOrders : []}
          isLoading={tableQuery.isLoading}
          onClearSelection={clearSelection}
          onRegisterDeposit={() => depositDialog.open(selectedOrders)}
        />
      )}
      <CasheaOrderSheet
        order={sheetOrder}
        isOpen={isOrderSheetOpen}
        onOpenChange={setOrderSheetOpen}
        actions={isAdmin ? orderActions : undefined}
        unavailable={
          search.orderId && !sheetOrder
            ? {
                message: orderQuery.isPending
                  ? "Cargando orden…"
                  : orderQuery.isError
                    ? "No pudimos cargar la orden."
                    : "No encontramos la orden en el negocio activo.",
                onRetry: orderQuery.isError ? () => void orderQuery.refetch() : undefined,
                isRetrying: orderQuery.isFetching,
              }
            : undefined
        }
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
