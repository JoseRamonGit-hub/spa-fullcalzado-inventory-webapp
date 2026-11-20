import type { ReactNode } from "react";
import type { Column } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  /** Icono decorativo antes del título (p. ej. el logo de una integración). */
  icon?: ReactNode;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  icon,
}: DataTableColumnHeaderProps<TData, TValue>) {
  "use no memo";

  if (!column.getCanSort()) {
    return (
      <span className={cn("uppercase", icon && "inline-flex items-center gap-1.5")}>
        {icon}
        {title}
      </span>
    );
  }

  const sorted = column.getIsSorted();
  const isRightAligned = column.columnDef.meta?.align === "right";
  const SortIcon = sorted === "asc" ? ChevronUp : sorted === "desc" ? ChevronDown : ChevronsUpDown;
  const sortIndicator = (
    <SortIcon
      className={cn(
        "size-3 shrink-0",
        !sorted && "opacity-20 transition-opacity group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50",
      )}
      aria-hidden="true"
    />
  );

  const nextSort = column.getNextSortingOrder();
  const sortActionLabel =
    nextSort === "asc"
      ? `Ordenar ${title} de forma ascendente`
      : nextSort === "desc"
        ? `Ordenar ${title} de forma descendente`
        : `Quitar el orden de ${title}`;

  return (
    <button
      type="button"
      className={cn(
        "group/sort hover:text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm uppercase transition-colors outline-none select-none focus-visible:ring-2",
        sorted && "text-foreground",
      )}
      onClick={column.getToggleSortingHandler()}
      aria-label={sortActionLabel}
    >
      {isRightAligned ? sortIndicator : null}
      {icon}
      {title}
      {isRightAligned ? null : sortIndicator}
    </button>
  );
}
