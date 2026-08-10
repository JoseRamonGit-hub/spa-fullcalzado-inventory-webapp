import * as React from "react";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  filterControlTextClassName,
  filterIconClassName,
  filterStateClassName,
  filterTriggerClassName,
} from "@/components/ui/filter-control";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatCalendarDate, formatDateForBackend } from "@/utils/formatters";
import type { ProductHistoryPeriod } from "../product-history-filter";

type ProductHistoryPeriodFilterProps = {
  period: ProductHistoryPeriod;
  customRange: DateRange | undefined;
  onPeriodChange: (period: ProductHistoryPeriod) => void;
  onCustomRangeChange: (range: DateRange | undefined) => void;
};

const periodLabels: Record<ProductHistoryPeriod, string> = {
  "last-30-days": "Últimos 30 días",
  "last-90-days": "Últimos 90 días",
  all: "Todo el historial",
  custom: "Rango personalizado",
};

function getCaracasToday() {
  const [year, month, day] = formatDateForBackend(new Date()).split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "Seleccionar fechas";
  if (!range.to) return `${formatCalendarDate(range.from)}…`;
  return `${formatCalendarDate(range.from)} – ${formatCalendarDate(range.to)}`;
}

export function ProductHistoryPeriodFilter({
  period,
  customRange,
  onPeriodChange,
  onCustomRangeChange,
}: ProductHistoryPeriodFilterProps) {
  const [customRangeOpen, setCustomRangeOpen] = React.useState(false);
  const caracasToday = getCaracasToday();

  const clearCustomRange = () => {
    onCustomRangeChange(undefined);
    onPeriodChange("last-30-days");
    setCustomRangeOpen(false);
  };

  return (
    <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
      <label className="sr-only" htmlFor="product-history-period">
        Período del historial
      </label>
      <NativeSelect
        id="product-history-period"
        size="sm"
        value={period}
        aria-label="Período del historial"
        className={cn(filterControlTextClassName, filterStateClassName(period !== "last-30-days"))}
        onChange={(event) => onPeriodChange(event.target.value as ProductHistoryPeriod)}
      >
        {Object.entries(periodLabels).map(([value, label]) => (
          <NativeSelectOption key={value} value={value}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {period === "custom" ? (
        <div className="flex min-w-0 items-center gap-1">
          <Popover open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(filterTriggerClassName, "max-w-full", filterStateClassName(Boolean(customRange?.from)))}
                aria-label="Seleccionar rango personalizado"
              >
                <CalendarDays
                  data-icon="inline-start"
                  aria-hidden="true"
                  className={filterIconClassName(Boolean(customRange?.from))}
                />
                <span className="max-w-48 truncate">{formatRangeLabel(customRange)}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <PopoverTitle className="sr-only">Seleccionar rango personalizado</PopoverTitle>
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={onCustomRangeChange}
                defaultMonth={customRange?.from ?? caracasToday}
                numberOfMonths={2}
                captionLayout="dropdown"
                startMonth={new Date(1900, 0, 1)}
                endMonth={caracasToday}
                disabled={{ after: caracasToday, before: new Date(1900, 0, 1) }}
                locale={es}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          {customRange?.from ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground size-9 sm:size-8"
              aria-label="Limpiar rango y volver a los últimos 30 días"
              title="Limpiar rango personalizado"
              onClick={clearCustomRange}
            >
              <X aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
