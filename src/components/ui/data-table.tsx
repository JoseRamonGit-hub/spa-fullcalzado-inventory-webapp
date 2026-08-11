import {
  type ColumnDef,
  type ExpandedState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { PackageOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  getRowAriaLabel?: (row: TData) => string;
  meta?: Record<string, unknown>;
  isLoading?: boolean;
  getRowId?: (originalRow: TData, index: number) => string;
  renderSubRow?: (row: Row<TData>) => React.ReactNode;
  pageSize?: number;
  hidePagination?: boolean;
  autoExpandRowId?: string;
  expanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  getRowClassName?: (row: Row<TData>, index: number) => string | undefined;
  tableClassName?: string;
  scrollAreaLabel?: string;
  emptyStateClassName?: string;
  scrollAreaHeader?: React.ReactNode;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No hay resultados.",
  onRowClick,
  getRowAriaLabel,
  meta,
  isLoading,
  getRowId,
  renderSubRow,
  pageSize = 20,
  hidePagination,
  autoExpandRowId,
  expanded,
  onExpandedChange,
  getRowClassName,
  tableClassName,
  scrollAreaLabel,
  emptyStateClassName,
  scrollAreaHeader,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();

  const columnVisibility: VisibilityState = useMemo(() => {
    if (!isMobile) return {};
    const hidden: VisibilityState = {};
    for (const col of columns) {
      if (col.meta?.hideOnMobile) {
        const colId = "id" in col ? (col.id as string) : "accessorKey" in col ? (col.accessorKey as string) : "";
        if (colId) hidden[colId] = false;
      }
    }
    return hidden;
  }, [isMobile, columns]);

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({});
  const lastAutoExpandedRowIdRef = useRef<string | undefined>(undefined);

  const expandedState = expanded ?? internalExpanded;
  const handleExpandedChange = onExpandedChange ?? setInternalExpanded;

  useEffect(() => {
    if (!autoExpandRowId) {
      lastAutoExpandedRowIdRef.current = undefined;
      return;
    }

    if (lastAutoExpandedRowIdRef.current === autoExpandRowId) {
      return;
    }

    const targetIndex = data.findIndex((row, index) => {
      const rowId = getRowId ? getRowId(row, index) : String(index);
      return rowId === autoExpandRowId;
    });

    if (targetIndex === -1) {
      return;
    }

    handleExpandedChange((prev) =>
      prev === true ? { [autoExpandRowId]: true } : { ...prev, [autoExpandRowId]: true },
    );
    setPagination((prev) => ({ ...prev, pageIndex: Math.floor(targetIndex / prev.pageSize) }));
    lastAutoExpandedRowIdRef.current = autoExpandRowId;
  }, [autoExpandRowId, data, getRowId, handleExpandedChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(renderSubRow ? { getExpandedRowModel: getExpandedRowModel(), getRowCanExpand: () => true } : {}),
    enableMultiSort: false,
    state: {
      columnVisibility,
      pagination,
      sorting,
      ...(renderSubRow ? { expanded: expandedState } : {}),
    },
    onPaginationChange: setPagination,
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    ...(renderSubRow ? { onExpandedChange: handleExpandedChange } : {}),
    meta,
    getRowId,
  });

  const showPagination = !hidePagination && !isLoading && data.length > pageSize;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        className="custom-scrollbar min-w-0 flex-1 overflow-auto [&_div[data-slot=table-container]]:overflow-visible"
        role={scrollAreaLabel ? "region" : undefined}
        aria-label={scrollAreaLabel}
        tabIndex={scrollAreaLabel ? 0 : undefined}
      >
        {scrollAreaHeader ? <div className="bg-background sticky left-0 w-full">{scrollAreaHeader}</div> : null}
        <Table className={tableClassName}>
          <TableHeader className="bg-muted/95 sticky top-0 z-[1]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border bg-muted/50 hover:bg-muted/50 border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="px-4"
                      aria-sort={
                        header.column.getCanSort()
                          ? header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : header.column.getIsSorted() === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
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
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-label={onRowClick ? getRowAriaLabel?.(row.original) : undefined}
                    className={`border-border/40 hover:bg-table-hover border-b transition-colors ${index % 2 === 1 ? "bg-table-stripe" : ""} ${onRowClick || renderSubRow ? "cursor-pointer" : ""} ${getRowClassName?.(row, index) ?? ""}`}
                    onClick={() => {
                      if (renderSubRow) row.toggleExpanded();
                      onRowClick?.(row.original);
                    }}
                    onKeyDown={(event) => {
                      if (!onRowClick || event.currentTarget !== event.target) return;
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      onRowClick(row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="h-[30px] overflow-hidden px-4 py-0 text-[13px] whitespace-nowrap"
                      >
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
                <TableCell
                  colSpan={table.getVisibleFlatColumns().length}
                  className={cn("h-56 text-center", emptyStateClassName)}
                >
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
