import { useReturns } from "./hooks/useReturnQueries";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { DataTableError } from "@/components/ui/data-table-error";
import { columns } from "./columns";
import { ExpandedReturnRow } from "./components/expanded-return-row";
import { ReturnsSummary } from "./components/returns-summary";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { Route } from "@/routes/_app/returns";
import { useNavigate } from "@tanstack/react-router";
import type { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { useState } from "react";
import { formatDateTime } from "@/utils/formatters";

export function ReturnsPage() {
  const { date, returnId } = Route.useSearch();
  const navigate = useNavigate({ from: "/returns" });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const handleExpandedChange: OnChangeFn<ExpandedState> = (updater) => {
    setExpanded((prev) => (typeof updater === "function" ? updater(prev) : updater));
  };

  const setDate = (value: string | undefined) => {
    setExpanded({});
    navigate({ search: (prev) => ({ ...prev, date: value, returnId: undefined }) });
  };

  const { data: returns, isLoading, isError, isFetching, refetch } = useReturns(date);

  function renderContent() {
    if (isLoading) {
      return <DataTable columns={columns} data={[]} isLoading emptyMessage="" scrollAreaLabel="Devoluciones" />;
    }

    if (isError && !returns) {
      return <DataTableError title="No pudimos cargar las devoluciones" onRetry={refetch} isRetrying={isFetching} />;
    }

    return (
      <DataTable
        columns={columns}
        data={returns || []}
        getRowId={(row) => row.id}
        emptyMessage={
          date ? "No hay devoluciones registradas para esta fecha." : "No hay devoluciones en los últimos 30 días."
        }
        autoExpandRowId={returnId}
        expanded={expanded}
        onExpandedChange={handleExpandedChange}
        renderSubRow={(row) => <ExpandedReturnRow row={row} />}
        getRowAriaLabel={(row) =>
          `${row.type === "exchange" ? "Cambio" : "Devolución"} del ${formatDateTime(row.created_at)}`
        }
        scrollAreaLabel="Devoluciones"
      />
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar date={date} hasDirectedView={!!returnId} onDateChange={setDate} />
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : !isError || returns ? (
        <ReturnsSummary date={date} returns={returns || []} />
      ) : null}
      {renderContent()}
    </section>
  );
}
