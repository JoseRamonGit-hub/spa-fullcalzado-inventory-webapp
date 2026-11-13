import { useNavigate } from "@tanstack/react-router";
import { DataTable } from "@/components/ui/data-table";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { Route } from "@/routes/_app/cashea";
import { formatCalendarDateString } from "@/utils/formatters";
import type { CalendarDateRange, CasheaOrdersFilter } from "@/types";
import { columns } from "./columns";
import { Topbar } from "./components/topbar";
import { CasheaPendingSummary } from "./components/cashea-pending-summary";
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
  const navigate = useNavigate({ from: "/cashea" });
  const status = search.status ?? DEFAULT_CASHEA_STATUS_FILTER;
  const filter = resolveCasheaOrdersFilter(search);
  const hasRange = Boolean(search.from || search.to);

  const { data: orders, isLoading, isError, isFetching, refetch } = useCasheaOrders(filter);

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
        emptyMessage={getEmptyMessage(filter, hasRange)}
        getRowAriaLabel={(row) => `Orden Cashea ${row.order_number}`}
        scrollAreaLabel="Cuentas por cobrar Cashea"
      />
    </section>
  );
}
