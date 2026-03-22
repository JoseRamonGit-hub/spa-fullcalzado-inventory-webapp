import { useMovements } from "./hooks/useMovementQueries";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Topbar } from "./components/topbar";
import { Route } from "@/routes/_app/movements";
import { useNavigate } from "@tanstack/react-router";

export function MovementsPage() {
  const { date } = Route.useSearch();
  const navigate = useNavigate({ from: "/movements" });

  const setDate = (value: string | undefined) => {
    navigate({ search: (prev) => ({ ...prev, date: value }) });
  };

  const { data: movements, isLoading, isError } = useMovements(date);

  function renderContent() {
    if (isLoading) {
      return <DataTable columns={columns} data={[]} isLoading emptyMessage="" />;
    }

    if (isError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar los movimientos.</p>
        </div>
      );
    }

    return (
      <DataTable
        columns={columns}
        data={movements || []}
        getRowId={(row) => row.id}
        emptyMessage="No hay movimientos registrados."
      />
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar date={date} onDateChange={setDate} />
      {renderContent()}
    </section>
  );
}
