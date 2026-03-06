import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Search } from "lucide-react";

interface TopbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  stockFilter?: string;
  onStockFilterChange?: (value: string) => void;
}

export function Topbar({ search, onSearchChange, stockFilter, onStockFilterChange }: TopbarProps) {
  return (
    <div className="flex topbar-height items-center px-3 md:px-4 justify-between bg-background border-b gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <h2 className="font-semibold text-sm text-foreground whitespace-nowrap">Inventario</h2>
        </div>
        <div className="bg-card rounded-md">
          <InputGroup className="h-8 flex-1 md:max-w-xs">
            <InputGroupInput
              placeholder="Buscar código o descripción..."
              className="text-sm md:text-xs"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <InputGroupAddon>
              <Search className="h-4 w-4 md:h-3.5 md:w-3.5" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div className="shrink-0">
        <NativeSelect
          className="h-8 text-sm md:text-xs min-w-28"
          value={stockFilter}
          onChange={(e) => onStockFilterChange?.(e.target.value)}
        >
          <NativeSelectOption value="all">Stock: Todos</NativeSelectOption>
          <NativeSelectOption value="in-stock">Con stock</NativeSelectOption>
          <NativeSelectOption value="no-stock">Sin stock</NativeSelectOption>
        </NativeSelect>
      </div>
    </div>
  );
}
