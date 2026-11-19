import { Search } from "lucide-react";
import { filterToggleItemClassName } from "@/components/ui/filter-control";
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
  search,
  onSearchChange,
  status,
  statusCounts,
  from,
  to,
  onStatusChange,
  onRangeChange,
}: TopbarProps) {
  return (
    <header className="bg-background flex shrink-0 flex-col gap-2 border-b px-3 py-2 md:h-(--topbar-height) md:flex-row md:items-center md:justify-between md:px-4 md:py-0">
      <div className="flex w-full min-w-0 items-center gap-4 md:flex-1">
        <BusinessModuleTitle title="Cashea" />
        <div className="bg-card flex-1 rounded-md md:max-w-xs">
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
      </div>

      <div className="flex w-full min-w-0 items-center gap-1.5 md:w-auto">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={status}
          onValueChange={(value) => value && onStatusChange(value as CasheaStatusFilter)}
          aria-label="Estado de la cuenta por cobrar"
          className="bg-card min-w-0 flex-1 max-md:overflow-x-auto md:flex-none"
        >
          {casheaStatusFilters.map((value) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className={cn("group/status h-8 flex-1 gap-1.5 px-2.5 md:flex-none", filterToggleItemClassName)}
            >
              {casheaStatusFilterLabels[value]}
              {statusCounts ? (
                <span className="text-muted-foreground group-data-[state=on]/status:text-primary text-[11px] font-medium tabular-nums">
                  {formatInteger(statusCounts[value])}
                </span>
              ) : null}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <CasheaDateRangeFilter
          from={from}
          to={to}
          placeholder={getCasheaDefaultPeriodLabel(status)}
          onChange={onRangeChange}
        />
      </div>
    </header>
  );
}
