import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { DatePickerFilter } from "@/components/ui/date-picker-filter";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ProductStockAlertType } from "@/types";

type TopbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  date: string | undefined;
  onDateChange: (value: string | undefined) => void;
  stockStatus: ProductStockAlertType | undefined;
  onStockStatusChange: (value: ProductStockAlertType | undefined) => void;
};

export function Topbar({ search, onSearchChange, date, onDateChange, stockStatus, onStockStatusChange }: TopbarProps) {
  return (
    <header className="bg-background flex shrink-0 flex-col gap-2 border-b px-3 py-2 md:h-(--topbar-height) md:flex-row md:items-center md:justify-between md:px-4 md:py-0">
      <div className="flex w-full min-w-0 items-center gap-4 md:flex-1">
        <BusinessModuleTitle title="Inventario" />
        <div className="bg-card flex-1 rounded-md md:max-w-xs">
          <InputGroup className="h-8">
            <InputGroupInput
              placeholder="Buscar código o descripción..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-0 text-sm md:text-xs"
            />
            <InputGroupAddon align="inline-end">
              <Search className="h-4 w-4 md:h-3.5 md:w-3.5" aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center gap-1.5 md:w-auto">
        <NativeSelect
          size="sm"
          value={stockStatus ?? ""}
          onChange={(event) =>
            onStockStatusChange((event.target.value || undefined) as ProductStockAlertType | undefined)
          }
          aria-label="Estado de inventario"
          wrapperClassName="w-full max-w-36"
        >
          <NativeSelectOption value="">Todos</NativeSelectOption>
          <NativeSelectOption value="low_stock">Stock bajo</NativeSelectOption>
          <NativeSelectOption value="stagnant">Estancado</NativeSelectOption>
        </NativeSelect>
        <DatePickerFilter value={date} onChange={onDateChange} placeholder="Filtrar por día" />
      </div>
    </header>
  );
}
