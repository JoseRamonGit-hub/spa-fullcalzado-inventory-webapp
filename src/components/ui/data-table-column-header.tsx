import type { Column } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  "use no memo";

  if (!column.getCanSort()) {
    return <div className={cn("uppercase", className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();
  const nextSort = column.getNextSortingOrder();
  const sortActionLabel =
    nextSort === "asc"
      ? `Ordenar ${title} de forma ascendente`
      : nextSort === "desc"
        ? `Ordenar ${title} de forma descendente`
        : `Quitar el orden de ${title}`;

  return (
    <div className={cn("flex w-full items-center", className)}>
      <button
        type="button"
        className={cn(
          "group/sort hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm uppercase transition-colors outline-none select-none focus-visible:ring-2",
          sorted && "text-foreground",
        )}
        onClick={column.getToggleSortingHandler()}
        aria-label={sortActionLabel}
      >
        {title}
        {sorted === "asc" ? (
          <ChevronUp className="size-3" aria-hidden="true" />
        ) : sorted === "desc" ? (
          <ChevronDown className="size-3" aria-hidden="true" />
        ) : (
          <ChevronsUpDown
            className="size-3 opacity-20 transition-opacity group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
