import { useMovements } from "./hooks";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Topbar } from "./components/topbar";
export function MovementsPage() {
  const { data: movements, isLoading, isError } = useMovements();

  if (isLoading) {
    return <div className="p-4">Cargando movimientos...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error al cargar los movimientos.</div>;
  }

  return (
    <section className="flex flex-col">
      <Topbar />
      <div className="flex flex-col">
        <DataTable columns={columns} data={movements || []} emptyMessage="No hay movimientos registrados." />
      </div>
    </section>
  );
}
