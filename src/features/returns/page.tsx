import { useReturns } from "./hooks/useReturnQueries";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { ExpandedReturnRow } from "./components/expanded-return-row";
import { Route } from "@/routes/_app/returns";
import { useNavigate } from "@tanstack/react-router";
import type { ExpandedState, OnChangeFn } from "@tanstack/react-table";
import { useState } from "react";

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

  const { data: returns, isLoading, isError } = useReturns(date);

  function renderContent() {
    if (isLoading) {
      return <DataTable columns={columns} data={[]} isLoading emptyMessage="" />;
    }

    if (isError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar las devoluciones.</p>
        </div>
      );
    }

    return (
      <DataTable
        columns={columns}
        data={returns || []}
        getRowId={(row) => row.id}
        emptyMessage="No hay devoluciones registradas."
        autoExpandRowId={returnId}
        expanded={expanded}
        onExpandedChange={handleExpandedChange}
        renderSubRow={(row) => <ExpandedReturnRow row={row} />}
      />
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar date={date} hasDirectedView={!!returnId} onDateChange={setDate} />
      {renderContent()}
    </section>
  );
}
