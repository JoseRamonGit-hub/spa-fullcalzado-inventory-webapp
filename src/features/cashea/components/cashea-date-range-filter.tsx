import { useState } from "react";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { filterIconClassName, filterStateClassName, filterTriggerClassName } from "@/components/ui/filter-control";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CalendarDateRange } from "@/types";
import { formatCalendarDateForBackend, formatCalendarDateString, formatDateForBackend } from "@/utils/formatters";
import { isCalendarDate } from "../cashea-receivables";

type CasheaDateRangeFilterProps = CalendarDateRange & {
  /** Texto del botón sin rango elegido; describe la vista que se aplica en su lugar. */
  placeholder: string;
  onChange: (range: CalendarDateRange) => void;
};

function toLocalDate(dateString: string | undefined) {
  if (!isCalendarDate(dateString)) return undefined;

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatRangeLabel(from: string | undefined, to: string | undefined) {
  if (from && to && from !== to) return `${formatCalendarDateString(from)} – ${formatCalendarDateString(to)}`;
  if (from && to) return formatCalendarDateString(from);
  if (from) return `Desde ${formatCalendarDateString(from)}`;
  return `Hasta ${formatCalendarDateString(to)}`;
}

export function CasheaDateRangeFilter({ from, to, placeholder, onChange }: CasheaDateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const caracasToday = toLocalDate(formatDateForBackend(new Date()));
  const hasRange = isCalendarDate(from) || isCalendarDate(to);
  const selected: DateRange | undefined = hasRange ? { from: toLocalDate(from), to: toLocalDate(to) } : undefined;
  const label = hasRange ? formatRangeLabel(from, to) : placeholder;

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onChange({});
      return;
    }

    const nextFrom = formatCalendarDateForBackend(range.from);
    // Un solo día elegido es un rango de ese día; el siguiente clic lo extiende.
    const nextTo = range.to ? formatCalendarDateForBackend(range.to) : nextFrom;
    onChange({ from: nextFrom, to: nextTo });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative inline-flex min-w-0">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(filterTriggerClassName, hasRange && "pe-9", filterStateClassName(hasRange))}
            aria-label={hasRange ? `Cambiar rango de fechas. Rango seleccionado: ${label}` : `${label}. Elegir rango`}
          >
            <CalendarDays data-icon="inline-start" aria-hidden="true" className={filterIconClassName(hasRange)} />
            <span className="max-w-48 truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        {hasRange ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground absolute end-0.5 top-1/2 -translate-y-1/2"
            aria-label="Limpiar rango de fechas"
            onClick={() => onChange({})}
          >
            <X data-icon="inline-start" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <PopoverContent className="bg-card w-auto p-0 shadow-lg" align="end" sideOffset={6}>
        <PopoverTitle className="sr-only">Elegir rango de fechas de venta</PopoverTitle>
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected?.from ?? caracasToday}
          numberOfMonths={2}
          captionLayout="dropdown"
          startMonth={new Date(1900, 0, 1)}
          endMonth={caracasToday}
          disabled={caracasToday ? { after: caracasToday } : undefined}
          locale={es}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
