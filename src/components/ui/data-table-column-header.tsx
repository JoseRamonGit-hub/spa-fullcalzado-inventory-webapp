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
    return <div className={className}>{title}</div>;
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
          "hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm transition-colors outline-none select-none focus-visible:ring-2",
          sorted && "text-foreground",
        )}
        onClick={column.getToggleSortingHandler()}
        aria-label={sortActionLabel}
      >
        {title}
        {sorted === "asc" ? (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        ) : sorted === "desc" ? (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
