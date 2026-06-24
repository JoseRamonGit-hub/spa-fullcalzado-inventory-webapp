import { DatePickerFilter } from "@/components/ui/date-picker-filter";
import { IterationCcw } from "lucide-react";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";

type TopbarProps = {
  date?: string;
  hasDirectedView: boolean;
  onDateChange: (value: string | undefined) => void;
};

export function Topbar({ date, hasDirectedView, onDateChange }: TopbarProps) {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <BusinessModuleTitle title="Devoluciones">
        {hasDirectedView && (
          <span className="bg-primary/10 text-primary hidden items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase sm:flex">
            <IterationCcw className="h-3 w-3" />
            Devolución seleccionada
          </span>
        )}
      </BusinessModuleTitle>
      <DatePickerFilter value={date} onChange={onDateChange} placeholder="Filtrar por día" />
    </header>
  );
}
