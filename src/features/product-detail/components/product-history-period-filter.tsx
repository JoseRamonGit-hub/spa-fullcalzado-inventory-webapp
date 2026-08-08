import * as React from "react";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { formatCalendarDate, formatDateForBackend } from "@/utils/formatters";
import type { ProductHistoryPeriod } from "../product-history-filter";

type ProductHistoryPeriodFilterProps = {
  period: ProductHistoryPeriod;
  customRange: DateRange | undefined;
  onPeriodChange: (period: ProductHistoryPeriod) => void;
  onCustomRangeChange: (range: DateRange | undefined) => void;
};

const periodLabels: Record<ProductHistoryPeriod, string> = {
  "last-30-days": "30 días",
  "last-90-days": "90 días",
  all: "Todo",
  custom: "Personalizado",
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

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="product-history-period">
        Período del historial
      </label>
      <NativeSelect
        id="product-history-period"
        size="sm"
        value={period}
        aria-label="Período del historial"
        onChange={(event) => onPeriodChange(event.target.value as ProductHistoryPeriod)}
      >
        {Object.entries(periodLabels).map(([value, label]) => (
          <NativeSelectOption key={value} value={value}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {period === "custom" ? (
        <Popover open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Seleccionar rango personalizado">
              <CalendarDays data-icon="inline-start" aria-hidden="true" />
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
              disabled={{ after: caracasToday, before: new Date(1900, 0, 1) }}
              locale={es}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
