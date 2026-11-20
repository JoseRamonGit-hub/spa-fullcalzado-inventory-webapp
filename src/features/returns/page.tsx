import { useReturns } from "./hooks/useReturnQueries";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { ExpandedReturnRow } from "./components/expanded-return-row";
import { ReturnsSummary } from "./components/returns-summary";
import { MetricsSkeleton } from "@/components/ui/metrics-skeleton";
import { Route } from "@/routes/_app/returns";
import { useNavigate } from "@tanstack/react-router";
import type { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { useState } from "react";
import { formatDateTime } from "@/utils/formatters";
import type { Return } from "@/types";
import { returnTypeLabels } from "./return-display";

export function ReturnsPage() {
  const { date, returnId, type, closedAt } = Route.useSearch();
  const navigate = useNavigate({ from: "/returns" });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const handleExpandedChange: OnChangeFn<ExpandedState> = (updater) => {
    setExpanded((prev) => (typeof updater === "function" ? updater(prev) : updater));
  };

  const setDate = (value: string | undefined) => {
    setExpanded({});
    navigate({ search: (prev) => ({ ...prev, date: value, returnId: undefined, closedAt: undefined }) });
  };

  const setType = (value: Return["type"] | undefined) => {
    setExpanded({});
    navigate({ search: (prev) => ({ ...prev, type: value, returnId: undefined }) });
  };

  const { data: returns, isLoading, isError, isFetching, refetch } = useReturns({ date, type, closedAt });
  const subject = type ? returnTypeLabels[type].plural.toLowerCase() : "cambios ni devoluciones";

  function renderContent() {
    return (
      <DataTable
        columns={columns}
        data={returns || []}
        isLoading={isLoading}
        errorState={
          isError && !returns
            ? { title: "No pudimos cargar los movimientos", onRetry: refetch, isRetrying: isFetching }
            : undefined
        }
        getRowId={(row) => row.id}
        emptyMessage={`No hay ${subject} ${date ? (closedAt ? "en este cierre" : "para esta fecha") : "en los últimos 30 días"}.`}
        autoExpandRowId={returnId}
        expanded={expanded}
        onExpandedChange={handleExpandedChange}
        renderSubRow={(row) => <ExpandedReturnRow row={row} />}
        getRowAriaLabel={(row) => `${returnTypeLabels[row.type].singular} del ${formatDateTime(row.created_at)}`}
        scrollAreaLabel="Devoluciones"
      />
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar date={date} type={type} hasDirectedView={!!returnId} onDateChange={setDate} onTypeChange={setType} />
      {isLoading ? (
        <MetricsSkeleton count={4} />
      ) : !isError || returns ? (
        <ReturnsSummary date={date} returns={returns || []} />
      ) : null}
      {renderContent()}
    </section>
  );
}
