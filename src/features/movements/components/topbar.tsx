import { DatePickerFilter } from "@/components/ui/date-picker-filter";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";

type TopbarProps = {
  date?: string;
  onDateChange: (value: string | undefined) => void;
};

export function Topbar({ date, onDateChange }: TopbarProps) {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <BusinessModuleTitle title="Movimientos" />
      <DatePickerFilter value={date} onChange={onDateChange} placeholder="Filtrar por día" />
    </header>
  );
}
