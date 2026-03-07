import { useMovements } from "./hooks";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Topbar } from "./components/topbar";

export function MovementsPage() {
  const { data: movements, isLoading, isError } = useMovements();

  if (isLoading) {
    return (
      <section className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col flex-1">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-destructive">Error al cargar los movimientos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col flex-1 overflow-hidden">
      <Topbar />
      <DataTable columns={columns} data={movements || []} emptyMessage="No hay movimientos registrados." />
    </section>
  );
}
