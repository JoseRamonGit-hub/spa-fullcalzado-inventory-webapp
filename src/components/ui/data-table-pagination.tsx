import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageIndex,
  pageSize,
  totalRows,
  pageCount,
  canPreviousPage,
  canNextPage,
  pageSizeOptions = [10, 20, 30, 50],
}: DataTablePaginationProps<TData>) {
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="border-border/60 flex shrink-0 items-center justify-between border-t px-3 py-1.5 md:px-4">
      <p className="text-muted-foreground hidden text-xs tabular-nums sm:block">
        {from}–{to} de {totalRows}
      </p>

      <p className="text-muted-foreground text-xs tabular-nums sm:hidden">
        {from}–{to} / {totalRows}
      </p>

      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Page size selector */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-muted-foreground text-xs">Filas</span>
          <NativeSelect
            size="sm"
            className="h-7 py-0 pr-7 pl-2 text-xs"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <NativeSelectOption key={size} value={size}>
                {size}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Page indicator */}
        <span className="text-muted-foreground text-xs tabular-nums">
          Pág. {pageIndex + 1}/{pageCount || 1}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-7 w-7 p-0 sm:inline-flex"
            onClick={() => table.firstPage()}
            disabled={!canPreviousPage}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-7 w-7 p-0 sm:inline-flex"
            onClick={() => table.lastPage()}
            disabled={!canNextPage}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
