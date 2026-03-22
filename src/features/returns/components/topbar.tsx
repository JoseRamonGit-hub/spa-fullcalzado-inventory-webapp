import { DatePickerFilter } from "@/components/ui/date-picker-filter";
import { IterationCcw } from "lucide-react";

type TopbarProps = {
  date?: string;
  hasDirectedView?: boolean;
  onDateChange: (value: string | undefined) => void;
};

export function Topbar({ date, hasDirectedView = false, onDateChange }: TopbarProps) {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="bg-primary h-1.5 w-1.5 rounded-full" aria-hidden="true" />
        <h2 className="font-heading text-foreground text-sm font-semibold whitespace-nowrap">Devoluciones</h2>
        {hasDirectedView && (
          <span className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
            <IterationCcw className="h-3 w-3" />
            Devolución seleccionada
          </span>
        )}
      </div>
      <DatePickerFilter value={date} onChange={onDateChange} placeholder="Filtrar por día" />
    </header>
  );
}
