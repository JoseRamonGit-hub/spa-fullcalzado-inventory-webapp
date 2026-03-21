import { useState } from "react";
import { useReturns } from "./hooks/useReturns";
import { Topbar } from "./components/topbar";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { ExpandedReturnRow } from "./components/expanded-return-row";

export function ReturnsPage() {
  const [date, setDate] = useState<string | undefined>(undefined);
  const { data: returns, isLoading, isError } = useReturns(date);

  function renderContent() {
    if (isLoading) {
      return <DataTable columns={columns} data={[]} isLoading emptyMessage="" />;
    }

    if (isError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-destructive text-sm">Error al cargar las devoluciones.</p>
        </div>
      );
    }

    return (
      <DataTable
        columns={columns}
        data={returns || []}
        emptyMessage="No hay devoluciones registradas."
        renderSubRow={(row) => <ExpandedReturnRow row={row} />}
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
