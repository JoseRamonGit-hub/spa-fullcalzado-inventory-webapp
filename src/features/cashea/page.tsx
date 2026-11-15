import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useDialogTarget } from "@/hooks/use-dialog-target";
import { DataTable } from "@/components/ui/data-table";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { Route } from "@/routes/_app/receivables/cashea";
import { formatCalendarDateString } from "@/utils/formatters";
import type { CalendarDateRange, CasheaOrder, CasheaOrdersFilter } from "@/types";
import { columns, type CasheaTableMeta } from "./columns";
import { Topbar } from "./components/topbar";
import { CasheaPendingSummary } from "./components/cashea-pending-summary";
import { AdjustCasheaOrderDialog } from "./components/adjust-cashea-order-dialog";
import { VoidCasheaOrderDialog } from "./components/void-cashea-order-dialog";
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
  const tableMeta: CasheaTableMeta = {
    canCorrectOrder: (order) => isAdmin && order.status === "pending",
    onAdjustOrder: adjustDialog.open,
    onVoidOrder: voidDialog.open,
  };

  const setStatus = (value: CasheaStatusFilter) => {
    navigate({ search: (prev) => ({ ...prev, status: value === DEFAULT_CASHEA_STATUS_FILTER ? undefined : value }) });
  };

  const setRange = (range: CalendarDateRange) => {
    navigate({ search: (prev) => ({ ...prev, from: range.from, to: range.to }) });
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar status={status} from={search.from} to={search.to} onStatusChange={setStatus} onRangeChange={setRange} />
      {isLoading ? <MetricsSkeleton count={3} /> : orders ? <CasheaPendingSummary orders={orders} /> : null}
      <DataTable
        columns={columns}
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
    </section>
  );
}
