import { useMovements } from "./hooks/useMovements";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Topbar } from "./components/topbar";
import { useState } from "react";

export function MovementsPage() {
  const [date, setDate] = useState<string | undefined>(undefined);
  const { data: movements, isLoading, isError } = useMovements(date);

  const topbar = <Topbar date={date} onDateChange={setDate} />;

  if (isLoading) {
    return (
      <section className="flex flex-1 flex-col overflow-hidden">
        {topbar}
        <DataTable columns={columns} data={[]} isLoading emptyMessage="" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-1 flex-col">
        {topbar}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar los movimientos.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      {topbar}
      <DataTable columns={columns} data={movements || []} emptyMessage="No hay movimientos registrados." />
    </section>
  );
}
