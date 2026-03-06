import { useProducts } from "./hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";

export function InventoryPage() {
  const { data: products, isLoading, isError } = useProducts();

  if (isLoading) {
    return <div className="p-4">Cargando inventario...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error al cargar el inventario.</div>;
  }

  return (
    <section className="flex flex-col">
      <Topbar />
      <div className="flex flex-col gap-4">
        <DataTable columns={columns} data={products || []} emptyMessage="No hay productos registrados." />
      </div>
    </section>
  );
}
