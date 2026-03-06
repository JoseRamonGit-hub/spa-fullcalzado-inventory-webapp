import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemo } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  meta?: Record<string, unknown>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No hay resultados.",
  onRowClick,
  meta,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();

  const columnVisibility: VisibilityState = useMemo(() => {
    if (!isMobile) return {};
    const hidden: VisibilityState = {};
    for (const col of columns) {
      const colMeta = col.meta as { hideOnMobile?: boolean } | undefined;
      if (colMeta?.hideOnMobile) {
        const colId = "id" in col ? (col.id as string) : "accessorKey" in col ? (col.accessorKey as string) : "";
        if (colId) hidden[colId] = false;
      }
    }
    return hidden;
  }, [isMobile, columns]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    meta,
  });

  return (
    <div className="overflow-auto flex-1 custom-scrollbar">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b bg-muted/30 hover:bg-muted/30">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="h-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={`border-b border-border/50 hover:bg-accent/40 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-3 py-1.5 text-sm whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <PackageOpen className="h-8 w-8 opacity-40" />
                  <span className="text-sm">{emptyMessage}</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
