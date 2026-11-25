import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  filterStateClassName,
  filterToggleItemClassName,
  filterTriggerClassName,
} from "@/components/ui/filter-control";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { cn } from "@/lib/utils";
import type { CalendarDateRange } from "@/types";
import { formatInteger } from "@/utils/formatters";
import {
  casheaStatusFilterLabels,
  casheaStatusFilters,
  getCasheaDefaultPeriodLabel,
  type CasheaStatusFilter,
} from "../cashea-receivables";
import { CasheaDateRangeFilter } from "./cashea-date-range-filter";

type TopbarProps = {
  onlyOrder: boolean;
  onClearFilters: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  status: CasheaStatusFilter;
  statusCounts?: Record<CasheaStatusFilter, number>;
  from?: string;
  to?: string;
  onStatusChange: (status: CasheaStatusFilter) => void;
  onRangeChange: (range: CalendarDateRange) => void;
};

export function Topbar({
  onlyOrder,
  onClearFilters,
  search,
  onSearchChange,
  status,
  statusCounts,
  from,
  to,
  onStatusChange,
  onRangeChange,
}: TopbarProps) {
  const renderStatusGroup = (values: readonly CasheaStatusFilter[], className: string) => (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={status}
      onValueChange={(value) => value && onStatusChange(value as CasheaStatusFilter)}
      aria-label="Estado de la cuenta por cobrar"
      className={cn("bg-card min-w-0", className)}
    >
      {values.map((value) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className={cn("group/status h-8 min-w-0 flex-1 gap-1.5 px-2.5 md:flex-none", filterToggleItemClassName)}
        >
          {casheaStatusFilterLabels[value]}
          {statusCounts ? (
            <span className="text-muted-foreground group-data-[state=on]/status:text-primary shrink-0 text-[11px] font-medium tabular-nums">
              {formatInteger(statusCounts[value])}
            </span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  return (
    <header className="bg-background flex shrink-0 flex-col gap-2 border-b px-3 py-2 md:h-(--topbar-height) md:flex-row md:items-center md:justify-between md:px-4 md:py-0">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:flex-1 md:flex-nowrap md:gap-4">
        <BusinessModuleTitle title="Cashea" />
        {!onlyOrder && (
          <div className="bg-card min-w-32 flex-1 rounded-md md:max-w-xs md:min-w-0">
            <InputGroup className="h-8">
              <InputGroupInput
                placeholder="Buscar orden o factura…"
                aria-label="Buscar por número de orden o de factura"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="border-0 text-sm md:text-xs"
              />
              <InputGroupAddon align="inline-end">
                <Search className="size-4 md:size-3.5" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
          </div>
        )}
        {onlyOrder && (
          <Button
            variant="outline"
            className={cn(filterTriggerClassName, filterStateClassName(false), "ml-auto shrink-0")}
            onClick={onClearFilters}
          >
            Volver a la lista de órdenes
          </Button>
        )}
      </div>

      {!onlyOrder && (
        <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto">
          {renderStatusGroup(casheaStatusFilters.slice(0, 2), "w-full md:hidden")}
          <div className="flex min-w-0 items-center gap-2 md:gap-1.5">
            {renderStatusGroup(casheaStatusFilters.slice(2), "flex-1 md:hidden")}
            {renderStatusGroup(casheaStatusFilters, "hidden md:flex")}
            <CasheaDateRangeFilter
              from={from}
              to={to}
              placeholder={getCasheaDefaultPeriodLabel(status)}
              onChange={onRangeChange}
            />
          </div>
        </div>
      )}
    </header>
  );
}
