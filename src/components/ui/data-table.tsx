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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableDensity,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableError } from "@/components/ui/data-table-error";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { PackageOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const INTERACTIVE_ROW_TARGET_SELECTOR =
  "a, button, input, select, textarea, [role='button'], [role='link'], [role='menuitem'], [role='switch'], [contenteditable='true'], [tabindex]:not([tabindex='-1'])";

function isNestedInteractiveTarget(target: EventTarget | null, row: HTMLTableRowElement) {
  if (!(target instanceof Element)) return false;
  const interactiveTarget = target.closest(INTERACTIVE_ROW_TARGET_SELECTOR);
  return interactiveTarget !== null && interactiveTarget !== row;
}

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
  density?: Extract<TableDensity, "operational" | "compact">;
  skeletonRowCount?: number;
  errorState?: {
    title: string;
    onRetry: () => void | Promise<unknown>;
    isRetrying?: boolean;
  };
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
  density = "operational",
  skeletonRowCount = 8,
  errorState,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const tableId = useId();

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
    autoResetPageIndex: true,
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    ...(renderSubRow ? { onExpandedChange: handleExpandedChange } : {}),
    meta,
    getRowId,
  });

  const rows = table.getRowModel().rows;
  const visibleColumnCount = Math.max(1, table.getVisibleFlatColumns().length);
  const showPagination = !hidePagination && !isLoading && table.getPageCount() > 1;

  if (errorState) {
    return <DataTableError {...errorState} />;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {isLoading ? (
        <span className="sr-only" role="status">
          Cargando datos…
        </span>
      ) : null}
      <ScrollShadow
        containerClassName="min-w-0 flex-1"
        className="custom-scrollbar overflow-auto"
        role={scrollAreaLabel ? "region" : undefined}
        aria-label={scrollAreaLabel}
        aria-busy={isLoading}
        tabIndex={scrollAreaLabel ? 0 : undefined}
      >
        {scrollAreaHeader ? <div className="bg-background sticky left-0 w-full">{scrollAreaHeader}</div> : null}
        <Table className={tableClassName} scrollShadow={false} density={density}>
          <TableHeader className="bg-muted/95 sticky top-0 z-[1]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border border-b bg-transparent hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={header.column.columnDef.meta?.className}
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
              <TableSkeleton columnCount={visibleColumnCount} rowCount={skeletonRowCount} density={density} />
            ) : rows.length ? (
              rows.map((row, index) => {
                const rowLabel = getRowAriaLabel?.(row.original);
                const subRowId = `${tableId}-${row.id}-details`;
                const rowActionLabel =
                  renderSubRow && rowLabel
                    ? `${row.getIsExpanded() ? "Contraer" : "Expandir"} detalles de ${rowLabel}`
                    : rowLabel;

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      tabIndex={onRowClick || renderSubRow ? 0 : undefined}
                      aria-label={onRowClick || renderSubRow ? rowActionLabel : undefined}
                      aria-expanded={renderSubRow ? row.getIsExpanded() : undefined}
                      aria-controls={renderSubRow && row.getIsExpanded() ? subRowId : undefined}
                      className={cn(
                        "border-border/40 hover:bg-table-hover border-b transition-colors",
                        index % 2 === 1 && "bg-table-stripe",
                        (onRowClick || renderSubRow) &&
                          "focus-visible:ring-ring/50 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset",
                        getRowClassName?.(row, index),
                      )}
                      onClick={(event) => {
                        if (isNestedInteractiveTarget(event.target, event.currentTarget)) return;
                        if (renderSubRow) row.toggleExpanded();
                        onRowClick?.(row.original);
                      }}
                      onKeyDown={(event) => {
                        if ((!onRowClick && !renderSubRow) || event.currentTarget !== event.target) return;
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        if (renderSubRow) row.toggleExpanded();
                        onRowClick?.(row.original);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn("overflow-hidden", cell.column.columnDef.meta?.className)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderSubRow && row.getIsExpanded() ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell id={subRowId} colSpan={row.getVisibleCells().length} className="p-0">
                          {renderSubRow(row)}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumnCount}
                  className={cn(density === "compact" ? "h-32" : "h-56", "text-center", emptyStateClassName)}
                >
                  <div className="text-muted-foreground flex flex-col items-center gap-2" role="status">
                    <PackageOpen className="size-8 opacity-40" aria-hidden="true" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollShadow>
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
