import { DatePickerFilter } from "@/components/ui/date-picker-filter";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { IterationCcw } from "lucide-react";
import { BusinessModuleTitle } from "@/features/business/components/business-module-title";
import type { Return } from "@/types";
import { Constants } from "@/types/supabase";
import { returnTypeLabels } from "../return-display";

type TopbarProps = {
  date?: string;
  type?: Return["type"];
  hasDirectedView: boolean;
  onDateChange: (value: string | undefined) => void;
  onTypeChange: (value: Return["type"] | undefined) => void;
};

export function Topbar({ date, type, hasDirectedView, onDateChange, onTypeChange }: TopbarProps) {
  return (
    <header className="bg-background flex min-h-(--topbar-height) shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2 md:px-4">
      <BusinessModuleTitle title="Devoluciones">
        {hasDirectedView && (
          <span className="bg-primary/10 text-primary hidden items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase sm:flex">
            <IterationCcw className="h-3 w-3" />
            Devolución seleccionada
          </span>
        )}
      </BusinessModuleTitle>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <NativeSelect
          aria-label="Tipo de movimiento"
          value={type ?? ""}
          onChange={({ target: { value } }) =>
            onTypeChange(Constants.public.Enums.return_types.find((type) => type === value))
          }
        >
          <NativeSelectOption value="">Todos los tipos</NativeSelectOption>
          {Constants.public.Enums.return_types.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {returnTypeLabels[value].plural}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <DatePickerFilter value={date} onChange={onDateChange} placeholder="Últimos 30 días" />
      </div>
    </header>
  );
}
