import { useState } from "react";
import { useStore } from "@tanstack/react-form";
import { History } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { parseExchangeRateInput, toExchangeRateInput } from "@/features/exchange-rates/exchange-rate-input";
import { useUpdateExchangeRate } from "@/features/exchange-rates/hooks/useExchangeRateMutations";
import { useExchangeRate, useExchangeRateHistory } from "@/features/exchange-rates/hooks/useExchangeRateQueries";
import { useAppForm } from "@/hooks/form";
import { cn } from "@/lib/utils";
import { formatCurrencyVES, formatDateTime } from "@/utils/formatters";
import { SettingsGroup, SettingsRow } from "./settings-group";

const SAVE_ERROR_MESSAGE = "No se pudo actualizar la tasa. Revisa la conexión e intenta de nuevo.";

export function ExchangeRateSection() {
  return (
    <SettingsGroup title="Tasa de cambio">
      <SettingsRow label="Tasa vigente" description="Bolívares por cada dólar" stackOnMobile>
        <CurrentRateControl />
      </SettingsRow>
      <SettingsRow label="Historial de cambios">
        <ExchangeRateHistory />
      </SettingsRow>
    </SettingsGroup>
  );
}

function CurrentRateControl() {
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  const { data: currentRate, isLoading, isError, refetch } = useExchangeRate();

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-20" />
      </div>
    );
  }

  if (isError && currentRate === undefined) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        No se pudo cargar.
        <Button variant="link" className="h-auto p-0" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </p>
    );
  }

  // La clave reinicia el campo con la tasa nueva al guardar o al cambiar de negocio.
  return <CurrentRateForm key={`${businessId}:${currentRate?.id ?? "none"}`} currentRate={currentRate?.rate ?? null} />;
}

const rateFieldOptions = {
  validators: {
    onChange: ({ value }: { value: string }) => {
      const parsed = parseExchangeRateInput(value);
      return "error" in parsed ? parsed.error : undefined;
    },
  },
};

function CurrentRateForm({ currentRate }: { currentRate: number | null }) {
  const user = useAuthStore((s) => s.user);
  const updateRate = useUpdateExchangeRate();
  const form = useAppForm({
    defaultValues: { rate: toExchangeRateInput(currentRate) },
    onSubmit: ({ value }) => {
      const parsed = parseExchangeRateInput(value.rate);
      if (!("rate" in parsed) || !user) return;

      updateRate.mutate(
        { rate: parsed.rate, source: "manual", updated_by: user.id },
        {
          onSuccess: () => toast.success(`Tasa actualizada a ${formatCurrencyVES(parsed.rate)}`),
          onError: () => toast.error(SAVE_ERROR_MESSAGE),
        },
      );
    },
  });

  const parsed = parseExchangeRateInput(useStore(form.store, (state) => state.values.rate));
  const nextRate = "rate" in parsed ? parsed.rate : null;
  const canSubmit = nextRate !== null && nextRate !== currentRate && !!user;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex justify-end"
    >
      <fieldset disabled={updateRate.isPending} className="flex items-center gap-2">
        <div className="w-36">
          <form.AppField name="rate" {...rateFieldOptions}>
            {(field) => (
              <field.TextFieldGroup
                label="Tasa vigente"
                hideLabel
                hideErrorMessage
                compact
                rightAddon="Bs."
                inputMode="decimal"
                autoComplete="off"
                placeholder="Ej. 78,50"
                className="font-medium tabular-nums"
              />
            )}
          </form.AppField>
        </div>
        <Button type="submit" disabled={!canSubmit}>
          {updateRate.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </fieldset>
    </form>
  );
}

function ExchangeRateHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: history, isLoading } = useExchangeRateHistory({ enabled: isOpen });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <History data-icon="inline-start" />
          Ver historial
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="text-muted-foreground border-b px-3 py-2 text-xs font-medium">Últimos cambios</p>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : !history?.length ? (
          <p className="text-muted-foreground px-3 py-4 text-center text-xs">Sin cambios registrados</p>
        ) : (
          <ol className="custom-scrollbar divide-border/60 max-h-72 divide-y overflow-y-auto">
            {history.map((entry, index) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                  <span className="truncate tabular-nums">{formatDateTime(entry.updated_at)}</span>
                  {entry.source === "bcv" && <Badge variant="outline">BCV</Badge>}
                </span>
                <span className={cn("shrink-0 text-[13px] tabular-nums", index === 0 && "font-semibold")}>
                  {formatCurrencyVES(entry.rate)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </PopoverContent>
    </Popover>
  );
}
