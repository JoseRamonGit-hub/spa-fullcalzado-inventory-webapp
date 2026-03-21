import { useMovements } from "./hooks/useMovements";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Topbar } from "./components/topbar";
import { useState } from "react";

export function MovementsPage() {
  const [date, setDate] = useState<string | undefined>(undefined);
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

    return <DataTable columns={columns} data={movements || []} emptyMessage="No hay movimientos registrados." />;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Topbar date={date} onDateChange={setDate} />
      {renderContent()}
    </section>
  );
}
