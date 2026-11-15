import { useStore } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessStore } from "@/features/business/store/useBusinessStore";
import { parseAmount } from "@/features/cashea/cashea-order-draft";
import { useUpdateCasheaSettings } from "@/features/cashea/hooks/useCasheaMutations";
import { useCasheaSettings } from "@/features/cashea/hooks/useCasheaQueries";
import { useAppForm } from "@/hooks/form";
import { getBusinessRuleErrorMessage } from "@/lib/errors";
import type { CasheaSettings, CasheaSettingsUpdate } from "@/types";
import { validateOnBlur } from "@/utils/form-validators";

const SAVE_ERROR_MESSAGE = "No se pudo guardar la Comisión Cashea. Revisa la conexión e intenta de nuevo.";

const PCT_INPUT_PROPS = {
  rightAddon: "%",
  inputMode: "decimal",
  autoComplete: "off",
  className: "text-sm tabular-nums",
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

  if (!settings) return <Skeleton className="h-36 w-full sm:max-w-md" />;

  return (
    <CasheaSettingsForm key={`${businessId}:${settings.serviceFeePct}:${settings.advanceFeePct}`} settings={settings} />
  );
}

function CasheaSettingsForm({ settings }: { settings: CasheaSettings }) {
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
        onSuccess: (recalculated) =>
          toast.success(
            update.applyToPending
              ? `Comisión Cashea guardada. Órdenes Pendientes recalculadas: ${recalculated}`
              : "Comisión Cashea guardada",
          ),
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <fieldset disabled={updateSettings.isPending} className="flex flex-col gap-4 sm:max-w-md">
        <div className="grid grid-cols-2 items-start gap-3">
          <form.AppField name="serviceFeePct" {...feePctFieldOptions}>
            {(field) => <field.TextFieldGroup label="Servicio sobre el total" compact {...PCT_INPUT_PROPS} />}
          </form.AppField>
          <form.AppField name="advanceFeePct" {...feePctFieldOptions}>
            {(field) => <field.TextFieldGroup label="Adelanto sobre lo financiado" compact {...PCT_INPUT_PROPS} />}
          </form.AppField>
        </div>

        <form.Field name="applyToPending">
          {(field) => (
            <Field orientation="horizontal">
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

        <Button type="submit" disabled={!hasChanges} className="self-start">
          {updateSettings.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </fieldset>
    </form>
  );
}
