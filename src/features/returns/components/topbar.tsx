import { DatePickerFilter } from "@/components/ui/date-picker-filter";

interface TopbarProps {
  date?: string;
  onDateChange: (value: string | undefined) => void;
}

export function Topbar({ date, onDateChange }: TopbarProps) {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="bg-primary h-1.5 w-1.5 rounded-full" aria-hidden="true" />
        <h2 className="text-foreground text-sm font-semibold whitespace-nowrap">Devoluciones</h2>
      </div>
      <DatePickerFilter value={date} onChange={onDateChange} placeholder="Filtrar por día" />
    </header>
  );
}
