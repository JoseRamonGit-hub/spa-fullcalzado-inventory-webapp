import type { ColumnDef, Row } from "@tanstack/react-table";
import type { ReactNode } from "react";

export function narrowActionsColumn<TData, TMeta>(
  renderActions: (data: TData, meta: TMeta, row: Row<TData>) => ReactNode,
): ColumnDef<TData> {
  return {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    meta: { className: "w-10" },
    cell: ({ row, table }) => {
      const meta = table.options.meta as TMeta | undefined;
      return meta ? renderActions(row.original, meta, row) : null;
    },
  };
}
