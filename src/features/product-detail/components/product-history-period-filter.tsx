import * as React from "react";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

  const clearCustomRange = () => {
    onCustomRangeChange(undefined);
    onPeriodChange("last-30-days");
    setCustomRangeOpen(false);
  };

  const handleClearCustomRange = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    clearCustomRange();
  };

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
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "bg-card border-border hover:bg-card/80 h-8 min-w-0 gap-1.5 px-2.5 text-xs font-normal transition-colors",
                customRange?.from ? "border-primary/40 text-foreground" : "text-muted-foreground",
              )}
              aria-label="Seleccionar rango personalizado"
            >
              <CalendarDays
                data-icon="inline-start"
                aria-hidden="true"
                className={cn(customRange?.from ? "text-primary" : "text-muted-foreground")}
              />
              <span className="max-w-48 truncate">{formatRangeLabel(customRange)}</span>
              {customRange?.from ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Limpiar rango personalizado"
                  onClick={handleClearCustomRange}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") handleClearCustomRange(event);
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent ml-0.5 cursor-pointer rounded-sm p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </span>
              ) : null}
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
