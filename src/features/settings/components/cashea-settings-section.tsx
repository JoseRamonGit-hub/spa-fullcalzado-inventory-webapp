import { useState } from "react";
import { useStore } from "@tanstack/react-form";
import { Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { parseAmount } from "@/features/cashea/cashea-order-draft";
import { CasheaLogoIcon } from "@/features/cashea/components/cashea-logo-icon";
import { useUpdateCasheaSettings } from "@/features/cashea/hooks/useCasheaMutations";
import { useCasheaSettings } from "@/features/cashea/hooks/useCasheaQueries";
import { useAppForm } from "@/hooks/form";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { CasheaSettings, CasheaSettingsUpdate } from "@/types";
import { formatPercent } from "@/utils/formatters";
import { validateOnBlur } from "@/utils/form-validators";
import { SettingsGroup, SettingsGroupFooter, SettingsRow } from "./settings-group";

const SAVE_ERROR_MESSAGE = "No se pudo guardar la Comisión Cashea. Revisa la conexión e intenta de nuevo.";

const GROUP_TITLE = "Comisión Cashea";
const GROUP_ICON = <CasheaLogoIcon className="shadow-sm" />;
const SERVICE_ROW = { label: "Servicio", description: "Sobre el total de la orden" };
const ADVANCE_ROW = { label: "Adelanto", description: "Sobre el Monto financiado" };

const PCT_INPUT_PROPS = {
  hideLabel: true,
  hideErrorMessage: true,
  compact: true,
  rightAddon: "%",
  inputMode: "decimal",
  autoComplete: "off",
  className: "font-medium tabular-nums",
} as const;

function parseFeePct(value: string): { pct: number } | { error: string } {
  const parsed = parseAmount(value, "Porcentaje inválido");
  if ("error" in parsed) return parsed;
  if (parsed.cents < 0 || parsed.cents > 10000) return { error: "Debe estar entre 0 y 100" };
  return { pct: parsed.cents / 100 };
}

type CasheaSettingsDraft = {
  serviceFeePct: string;
  advanceFeePct: string;
  applyToPending: boolean;
};

function toSettingsUpdate({ serviceFeePct, advanceFeePct, applyToPending }: CasheaSettingsDraft) {
  const service = parseFeePct(serviceFeePct);
  const advance = parseFeePct(advanceFeePct);
  if ("error" in service || "error" in advance) return null;
  return { serviceFeePct: service.pct, advanceFeePct: advance.pct, applyToPending } satisfies CasheaSettingsUpdate;
}

const feePctFieldOptions = {
  validators: {
    onChange: ({ value }: { value: string }) => {
      const parsed = parseFeePct(value);
      return "error" in parsed ? parsed.error : undefined;
    },
  },
  listeners: { onBlur: validateOnBlur },
};

export function CasheaSettingsSection() {
  const businessId = useBusinessStore((state) => state.activeBusinessId);
  const { data: settings } = useCasheaSettings();

  if (!settings) {
    return (
      <SettingsGroup title={GROUP_TITLE} icon={GROUP_ICON}>
        <SettingsRow {...SERVICE_ROW}>
          <Skeleton className="h-5 w-10" />
        </SettingsRow>
        <SettingsRow {...ADVANCE_ROW}>
          <Skeleton className="h-5 w-10" />
        </SettingsRow>
      </SettingsGroup>
    );
  }

  // La clave vuelve a bloquear y a llenar el formulario con lo guardado o al cambiar de negocio.
  return (
    <CasheaSettingsForm key={`${businessId}:${settings.serviceFeePct}:${settings.advanceFeePct}`} settings={settings} />
  );
}

function CasheaSettingsForm({ settings }: { settings: CasheaSettings }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const updateSettings = useUpdateCasheaSettings();
  const defaultValues: CasheaSettingsDraft = {
    serviceFeePct: String(settings.serviceFeePct),
    advanceFeePct: String(settings.advanceFeePct),
    applyToPending: false,
  };
  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      const update = toSettingsUpdate(value);
      if (!update) return;
      updateSettings.mutate(update, {
        onSuccess: (recalculated) => {
          setIsUnlocked(false);
          toast.success(
            update.applyToPending
              ? `Comisión Cashea guardada. Órdenes Pendientes recalculadas: ${recalculated}`
              : "Comisión Cashea guardada",
          );
        },
        onError: (error) => toast.error(getBusinessRuleErrorMessage(error, SAVE_ERROR_MESSAGE)),
      });
    },
  });

  const update = toSettingsUpdate(useStore(form.store, (state) => state.values));
  const hasChanges =
    !!update &&
    (update.applyToPending ||
      update.serviceFeePct !== settings.serviceFeePct ||
      update.advanceFeePct !== settings.advanceFeePct);

  const lock = () => {
    form.reset();
    setIsUnlocked(false);
  };

  const lockLabel = isUnlocked ? "Bloquear sin guardar" : "Desbloquear para editar";
  const lockButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={lockLabel}
          aria-pressed={isUnlocked}
          disabled={updateSettings.isPending}
          onClick={isUnlocked ? lock : () => setIsUnlocked(true)}
          className={cn(isUnlocked ? "text-primary" : "text-muted-foreground")}
        >
          {isUnlocked ? <LockOpen /> : <Lock />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{lockLabel}</TooltipContent>
    </Tooltip>
  );

  const footer = isUnlocked && (
    <SettingsGroupFooter>
      <form.Field name="applyToPending">
        {(field) => (
          <Field orientation="horizontal" className="w-auto">
            <Checkbox
              id={field.name}
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(checked === true)}
            />
            <FieldLabel htmlFor={field.name} className="font-normal">
              Aplicar también a las órdenes Pendientes
            </FieldLabel>
          </Field>
        )}
      </form.Field>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button type="button" variant="ghost" onClick={lock}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!hasChanges}>
          {updateSettings.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </SettingsGroupFooter>
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <fieldset disabled={updateSettings.isPending}>
        <SettingsGroup title={GROUP_TITLE} icon={GROUP_ICON} action={lockButton} footer={footer}>
          <SettingsRow {...SERVICE_ROW}>
            {isUnlocked ? (
              <div className="w-28">
                <form.AppField name="serviceFeePct" {...feePctFieldOptions}>
                  {(field) => <field.TextFieldGroup label={SERVICE_ROW.label} autoFocus {...PCT_INPUT_PROPS} />}
                </form.AppField>
              </div>
            ) : (
              <FeeValue pct={settings.serviceFeePct} />
            )}
          </SettingsRow>
          <SettingsRow {...ADVANCE_ROW}>
            {isUnlocked ? (
              <div className="w-28">
                <form.AppField name="advanceFeePct" {...feePctFieldOptions}>
                  {(field) => <field.TextFieldGroup label={ADVANCE_ROW.label} {...PCT_INPUT_PROPS} />}
                </form.AppField>
              </div>
            ) : (
              <FeeValue pct={settings.advanceFeePct} />
            )}
          </SettingsRow>
        </SettingsGroup>
      </fieldset>
    </form>
  );
}

function FeeValue({ pct }: { pct: number }) {
  return <span className="text-sm font-medium tabular-nums">{formatPercent(pct)}</span>;
}
