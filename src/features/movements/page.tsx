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

  const { data: movements, isLoading, isError, isFetching, refetch } = useMovements(date);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar date={date} onDateChange={setDate} />
      <DataTable
        columns={columns}
        data={movements || []}
        isLoading={isLoading}
        errorState={
          isError && !movements
            ? { title: "No pudimos cargar los movimientos", onRetry: refetch, isRetrying: isFetching }
            : undefined
        }
        getRowId={(row) => row.id}
        emptyMessage={date ? "No hay movimientos registrados para esta fecha." : "No hay movimientos registrados."}
        scrollAreaLabel="Movimientos de inventario"
      />
    </section>
  );
}
