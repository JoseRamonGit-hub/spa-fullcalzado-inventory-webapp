"use client";

import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { filterIconClassName, filterStateClassName, filterTriggerClassName } from "@/components/ui/filter-control";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateForBackend } from "@/utils/formatters";

/**
 * Returns "YYYY-MM-DD" in the America/Caracas timezone for the given Date.
 */
function toCaracasDateString(date: Date): string {
  return formatDateForBackend(date);
}

type DatePickerFilterProps = {
  /** The currently selected date string in "YYYY-MM-DD" format, or undefined for no filter */
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  /** Optional max CSS width for the trigger button  */
  className?: string;
};

export function DatePickerFilter({
  value,
  onChange,
  placeholder = "Filtrar por fecha",
  className,
}: DatePickerFilterProps) {
  const [open, setOpen] = React.useState(false);

  /** Convert stored YYYY-MM-DD string back to a Date for the calendar. */
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

    // Parse as local date to avoid UTC off-by-one shifts
    const [year, month, day] = value.split("-").map(Number);
    if (year < 1900) return undefined;

    const date = new Date(year, month - 1, day);
    const isValidDate =
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    return isValidDate ? date : undefined;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      setOpen(false);
      return;
    }
    onChange(toCaracasDateString(date));
    setOpen(false);
  };

  const handleReset = () => {
    onChange(undefined);
  };

  const displayLabel = selected ? format(selected, "d MMM, yyyy", { locale: es }) : placeholder;
  const triggerLabel = selected
    ? `Cambiar fecha. Fecha seleccionada: ${displayLabel}`
    : `${placeholder}. Seleccionar fecha`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative inline-flex min-w-0">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(filterTriggerClassName, value && "pe-9", filterStateClassName(Boolean(value)), className)}
            aria-label={triggerLabel}
          >
            <CalendarDays data-icon="inline-start" className={filterIconClassName(Boolean(value))} aria-hidden="true" />
            <span className="truncate">{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground absolute end-0.5 top-1/2 -translate-y-1/2"
            aria-label="Limpiar filtro de fecha"
            onClick={handleReset}
          >
            <X data-icon="inline-start" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <PopoverContent className="bg-card w-auto p-0 shadow-lg" align="end" sideOffset={6}>
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? new Date()}
            autoFocus
            className="rounded-t-md"
            locale={es}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            classNames={{
              root: "w-fit",
            }}
          />
          {value && (
            <div className="border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-7 w-full text-xs"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                <X data-icon="inline-start" aria-hidden="true" />
                Limpiar filtro
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
