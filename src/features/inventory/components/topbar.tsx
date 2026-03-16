import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { DatePickerFilter } from "@/components/ui/date-picker-filter";

interface TopbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  date?: string;
  onDateChange?: (value: string | undefined) => void;
}

export function Topbar({ search, onSearchChange, date, onDateChange }: TopbarProps) {
  return (
    <div className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="bg-primary h-1.5 w-1.5 rounded-full" />
          <h2 className="text-foreground text-sm font-semibold whitespace-nowrap">Inventario</h2>
        </div>
        <div className="bg-card rounded-md">
          <InputGroup className="h-8 flex-1 md:max-w-xs">
            <InputGroupInput
              placeholder="Buscar código o descripción..."
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="border-0 text-sm md:text-xs"
            />
            <InputGroupAddon align="inline-end">
              <Search className="h-4 w-4 md:h-3.5 md:w-3.5" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* <NativeSelect
          className="h-8 min-w-28 text-sm md:text-xs"
          value={stockFilter}
          onChange={(e) => onStockFilterChange?.(e.target.value)}
        >
          <NativeSelectOption value="all">Stock: Todos</NativeSelectOption>
          <NativeSelectOption value="in-stock">Con stock</NativeSelectOption>
          <NativeSelectOption value="no-stock">Sin stock</NativeSelectOption>
        </NativeSelect> */}

        <DatePickerFilter value={date} onChange={(v) => onDateChange?.(v)} placeholder="Filtrar por día" />
      </div>
    </div>
  );
}
