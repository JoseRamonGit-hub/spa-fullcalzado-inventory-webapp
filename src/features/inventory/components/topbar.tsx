import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { DatePickerFilter } from "@/components/ui/date-picker-filter";

type TopbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  date: string | undefined;
  onDateChange: (value: string | undefined) => void;
};

export function Topbar({ search, onSearchChange, date, onDateChange }: TopbarProps) {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="bg-primary h-1.5 w-1.5 rounded-full" aria-hidden="true" />
          <h1 className="text-foreground text-sm font-semibold whitespace-nowrap">Inventario</h1>
        </div>
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

      <div className="flex shrink-0 items-center gap-1.5">
        <DatePickerFilter value={date} onChange={onDateChange} placeholder="Filtrar por día" />
      </div>
    </header>
  );
}
