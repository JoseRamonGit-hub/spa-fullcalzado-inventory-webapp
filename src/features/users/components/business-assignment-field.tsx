import { CheckCircle2, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import type { Business, UserRole } from "@/types";

type FormError = { message?: string } | undefined;

type BusinessAssignmentFieldProps = {
  businesses: Business[];
  role: UserRole;
  selectedBusinessIds: string[];
  defaultBusinessId: string;
  onSelectedBusinessIdsChange: (businessIds: string[]) => void;
  onDefaultBusinessIdChange: (businessId: string) => void;
  businessErrors?: FormError[];
  defaultBusinessErrors?: FormError[];
  showErrors?: boolean;
};

function getDefaultBusinessOptions(role: UserRole, selectedBusinessIds: string[], businesses: Business[]) {
  if (role === "admin" && selectedBusinessIds.length === 0) {
    return businesses;
  }

  return businesses.filter((business) => selectedBusinessIds.includes(business.id));
}

function getBusinessHint(role: UserRole) {
  if (role === "admin") {
    return "Opcional para administradores. Si no asignas ninguno, seguirá viendo todos los negocios.";
  }

  return "Selecciona una o más tiendas. El empleado solo podrá operar en esas tiendas.";
}

export function BusinessAssignmentField({
  businesses,
  role,
  selectedBusinessIds,
  defaultBusinessId,
  onSelectedBusinessIdsChange,
  onDefaultBusinessIdChange,
  businessErrors,
  defaultBusinessErrors,
  showErrors,
}: BusinessAssignmentFieldProps) {
  const defaultOptions = getDefaultBusinessOptions(role, selectedBusinessIds, businesses);
  const businessInvalid = !!showErrors && !!businessErrors?.length;
  const defaultInvalid = !!showErrors && !!defaultBusinessErrors?.length;

  const toggleBusiness = (businessId: string) => {
    const isSelected = selectedBusinessIds.includes(businessId);
    const nextBusinessIds = isSelected
      ? selectedBusinessIds.filter((id) => id !== businessId)
      : [...selectedBusinessIds, businessId];

    onSelectedBusinessIdsChange(nextBusinessIds);

    if (defaultBusinessId && !nextBusinessIds.includes(defaultBusinessId)) {
      onDefaultBusinessIdChange(role === "admin" ? "" : (nextBusinessIds[0] ?? ""));
      return;
    }

    if (!defaultBusinessId && !isSelected) {
      onDefaultBusinessIdChange(businessId);
    }
  };

  return (
    <FieldSet className="gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <FieldLegend variant="label" className="mb-0">
            Negocios asignados
          </FieldLegend>
          <FieldDescription>{getBusinessHint(role)}</FieldDescription>
        </div>
        <Badge variant="outline" className="shrink-0">
          {selectedBusinessIds.length || (role === "admin" ? "Todos" : 0)}
        </Badge>
      </div>

      <Field data-invalid={businessInvalid}>
        <div className="grid gap-2 sm:grid-cols-2">
          {businesses.map((business) => {
            const isSelected = selectedBusinessIds.includes(business.id);

            return (
              <button
                key={business.id}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  "bg-card focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2.5 text-left shadow-xs transition-colors outline-none focus-visible:ring-[3px]",
                  isSelected
                    ? "border-primary/60 bg-primary/10 text-foreground ring-primary/20 ring-1"
                    : "border-border/70 text-foreground hover:border-primary/30 hover:bg-accent/50",
                )}
                onClick={() => toggleBusiness(business.id)}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Store className="size-4" />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{business.name}</span>
                  <span className="text-muted-foreground truncate text-[11px]">{business.slug}</span>
                </span>

                {isSelected ? <CheckCircle2 className="text-primary size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
        {businessInvalid ? <FieldError errors={businessErrors} /> : null}
      </Field>

      <Field data-invalid={defaultInvalid}>
        <FieldLabel htmlFor="default_business_id">Negocio predeterminado</FieldLabel>
        <NativeSelect
          id="default_business_id"
          value={defaultBusinessId}
          onChange={(event) => onDefaultBusinessIdChange(event.target.value)}
          wrapperClassName="w-full"
          className="w-full"
          aria-invalid={defaultInvalid}
        >
          <NativeSelectOption value="">Seleccionar negocio</NativeSelectOption>
          {defaultOptions.map((business) => (
            <NativeSelectOption key={business.id} value={business.id}>
              {business.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription>Será la primera tienda activa al iniciar sesión.</FieldDescription>
        {defaultInvalid ? <FieldError errors={defaultBusinessErrors} /> : null}
      </Field>
    </FieldSet>
  );
}
