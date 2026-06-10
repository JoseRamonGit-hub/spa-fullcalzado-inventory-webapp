"use client";

import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
    // Parse as local date to avoid UTC off-by-one shifts
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
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

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const displayLabel = selected ? format(selected, "d MMM, yyyy", { locale: es }) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-card border-border hover:bg-card/80 h-8 min-w-0 gap-1.5 px-2.5 text-xs font-normal transition-colors",
            value ? "border-primary/40 text-foreground" : "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className={cn("h-3.5 w-3.5 shrink-0", value ? "text-primary" : "text-muted-foreground")} />
          <span className="truncate">{displayLabel}</span>
          {value && (
            <span
              role="button"
              aria-label="Limpiar filtro de fecha"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground hover:bg-accent ml-0.5 cursor-pointer rounded-sm p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
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
                <X className="mr-1.5 h-3 w-3" />
                Limpiar filtro
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
