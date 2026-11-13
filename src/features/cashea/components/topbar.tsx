import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { filterControlTextClassName, filterStateClassName } from "@/components/ui/filter-control";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import { cn } from "@/lib/utils";
import type { CalendarDateRange } from "@/types";
import {
  casheaStatusFilterLabels,
  casheaStatusFilters,
  DEFAULT_CASHEA_STATUS_FILTER,
  getCasheaDefaultPeriodLabel,
  type CasheaStatusFilter,
} from "../cashea-receivables";
import { CasheaDateRangeFilter } from "./cashea-date-range-filter";

type TopbarProps = {
  status: CasheaStatusFilter;
  from?: string;
  to?: string;
  onStatusChange: (status: CasheaStatusFilter) => void;
  onRangeChange: (range: CalendarDateRange) => void;
};

export function Topbar({ status, from, to, onStatusChange, onRangeChange }: TopbarProps) {
  return (
    <header className="topbar-height bg-background flex items-center justify-between gap-2 border-b px-3 md:px-4">
      <BusinessModuleTitle title="Cashea" />
      <div className="flex min-w-0 items-center gap-2">
        <NativeSelect
          size="sm"
          value={status}
          aria-label="Estado de la cuenta por cobrar"
          className={cn(filterControlTextClassName, filterStateClassName(status !== DEFAULT_CASHEA_STATUS_FILTER))}
          onChange={(event) => onStatusChange(event.target.value as CasheaStatusFilter)}
        >
          {casheaStatusFilters.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {casheaStatusFilterLabels[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
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
