import { useMovements } from "./hooks";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Topbar } from "./components/topbar";

export function MovementsPage() {
  const { data: movements, isLoading, isError } = useMovements();

  if (isLoading) {
    return (
      <section className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-1 flex-col">
        <Topbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar los movimientos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <Topbar />
      <DataTable columns={columns} data={movements || []} emptyMessage="No hay movimientos registrados." />
    </section>
  );
}
