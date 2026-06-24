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
    <FieldSet className="gap-3">
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
        {businesses.length > 0 ? (
          <div className="custom-scrollbar grid max-h-44 gap-2 overflow-auto pr-1 sm:grid-cols-2">
            {businesses.map((business) => {
              const isSelected = selectedBusinessIds.includes(business.id);

              return (
                <button
                  key={business.id}
                  type="button"
                  aria-pressed={isSelected}
                  className={cn(
                    "bg-card focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-12 items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-[3px]",
                    isSelected
                      ? "border-primary/60 bg-primary/8 text-foreground ring-primary/15 ring-1"
                      : "border-border/70 text-foreground hover:border-primary/30 hover:bg-accent/40",
                  )}
                  onClick={() => toggleBusiness(business.id)}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Store className="size-3.5" />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{business.name}</span>
                    <span className="text-muted-foreground truncate text-[11px]">{business.slug}</span>
                  </span>

                  {isSelected ? <CheckCircle2 className="text-primary size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
            No hay negocios disponibles para asignar.
          </div>
        )}
        {businessInvalid ? <FieldError errors={businessErrors} /> : null}
      </Field>

      <div className="border-border/70 bg-muted/20 rounded-md border p-3">
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
          <FieldDescription className="text-xs">Será la primera tienda activa al iniciar sesión.</FieldDescription>
          {defaultInvalid ? <FieldError errors={defaultBusinessErrors} /> : null}
        </Field>
      </div>
    </FieldSet>
  );
}
