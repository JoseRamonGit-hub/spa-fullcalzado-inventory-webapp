import type { Column } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

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

  return (
    <div className={cn("flex w-full items-center", className)}>
      <button
        type="button"
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1 transition-colors select-none",
          sorted && "text-foreground",
        )}
        onClick={column.getToggleSortingHandler()}
      >
        {title}
        {sorted === "asc" ? (
          <ChevronUp className="size-3.5" />
        ) : sorted === "desc" ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-50" />
        )}
      </button>
    </div>
  );
}
