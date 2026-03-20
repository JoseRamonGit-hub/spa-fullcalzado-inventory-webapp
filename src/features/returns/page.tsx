import { useState } from "react";
import { useReturns } from "./hooks/useReturns";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { ExpandedReturnRow } from "./components/expanded-return-row";

export function ReturnsPage() {
  const [date, setDate] = useState<string | undefined>(undefined);
  const { data: returns, isLoading, isError } = useReturns(date);

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
          <p className="text-destructive text-sm">Error al cargar las devoluciones.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      {topbar}
      <DataTable
        columns={columns}
        data={returns || []}
        emptyMessage="No hay devoluciones registradas."
        renderSubRow={(row) => <ExpandedReturnRow row={row} />}
      />
    </section>
  );
}
