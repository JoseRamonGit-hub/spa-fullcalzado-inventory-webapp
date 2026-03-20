import {
  type ColumnDef,
  type PaginationState,
  type Row,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { PackageOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemo, useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  meta?: Record<string, unknown>;
  isLoading?: boolean;
  getRowId?: (originalRow: TData, index: number) => string;
  renderSubRow?: (row: Row<TData>) => React.ReactNode;
  pageSize?: number;
  hidePagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No hay resultados.",
  onRowClick,
  meta,
  isLoading,
  getRowId,
  renderSubRow,
  pageSize = 20,
  hidePagination,
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

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(renderSubRow ? { getExpandedRowModel: getExpandedRowModel(), getRowCanExpand: () => true } : {}),
    state: {
      columnVisibility,
      pagination,
    },
    onPaginationChange: setPagination,
    meta,
    getRowId,
  });

  const showPagination = !hidePagination && !isLoading && data.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="custom-scrollbar flex-1 overflow-auto [&_div[data-slot=table-container]]:overflow-visible">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border bg-muted/50 hover:bg-muted/50 border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground h-7 px-4 text-[10px] font-semibold tracking-wider whitespace-nowrap uppercase"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columnCount={table.getVisibleFlatColumns().length} />
            ) : table.getRowModel().rows?.length ? (
              table
                .getRowModel()
                .rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`border-border/40 hover:bg-table-hover border-b transition-colors ${index % 2 === 1 ? "bg-table-stripe" : ""} ${onRowClick || renderSubRow ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (renderSubRow) row.toggleExpanded();
                      onRowClick?.(row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="h-8 overflow-hidden px-4 py-0.5 text-[13px] whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
                .flatMap((rowEl, index) => {
                  const row = table.getRowModel().rows[index];
                  if (renderSubRow && row.getIsExpanded()) {
                    return [
                      rowEl,
                      <TableRow key={`${row.id}-expanded`} className="hover:bg-transparent">
                        <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                          {renderSubRow(row)}
                        </TableCell>
                      </TableRow>,
                    ];
                  }
                  return [rowEl];
                })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-56 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <PackageOpen className="h-8 w-8 opacity-40" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <DataTablePagination
          table={table}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalRows={table.getFilteredRowModel().rows.length}
          pageCount={table.getPageCount()}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
        />
      )}
    </div>
  );
}
