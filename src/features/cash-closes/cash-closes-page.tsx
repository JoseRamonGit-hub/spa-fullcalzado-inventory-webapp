import { useCashCloses } from "./hooks";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export function CashClosesPage() {
  const { data: cashCloses, isLoading, isError } = useCashCloses();

  if (isLoading) {
    return <div className="p-4">Cargando cierres de caja...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error al cargar los cierres de caja.</div>;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="flex flex-col">
      <Topbar />

      <div className="flex flex-col">
        {/* RESUMEN DEL DÍA */}
        <div className="flex flex-col gap-4 p-4 border-b bg-muted/10">
          <h3 className="font-semibold leading-none tracking-tight text-sm uppercase text-muted-foreground">
            Resumen del Día — {today}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex justify-between items-center border bg-background rounded-md p-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Transacciones
              </span>
              <span className="text-xl font-bold">0</span>
            </div>
            <div className="flex justify-between items-center border bg-background rounded-md p-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Unidades Vendidas
              </span>
              <span className="text-xl font-bold">0</span>
            </div>
            <div className="flex justify-between items-center border bg-background rounded-md p-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Total USD</span>
              <span className="text-xl font-bold">$0.00</span>
            </div>
            <div className="flex justify-between items-center border bg-background rounded-md p-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Total VES</span>
              <span className="text-xl font-bold">0.00</span>
            </div>
          </div>

          <Button className="w-full bg-[#c9a68a] hover:bg-[#b5957a] text-white">
            <Lock className="mr-2 h-4 w-4" />
            CIERRE DE DÍA
          </Button>
        </div>

        {/* CIERRES ANTERIORES */}
        <div className="flex flex-col">
          <div className="p-4 pb-2 bg-muted/10">
            <h3 className="font-semibold leading-none tracking-tight text-sm uppercase text-muted-foreground">
              Cierres Anteriores
            </h3>
          </div>
          <DataTable columns={columns} data={cashCloses || []} emptyMessage="No hay cierres de caja registrados." />
        </div>
      </div>
    </section>
  );
}
