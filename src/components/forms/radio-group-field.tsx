import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFieldContext } from "@/hooks/form";
import { cn } from "@/lib/utils";
import { COMPACT_FIELD_LABEL_CLASS_NAME } from "./field-wrapper";

export type RadioGroupFieldOption = {
  value: string;
  label: string;
  /** Recordatorio de una línea bajo las opciones, solo mientras esta opción está elegida. */
  hint?: string;
};

type RadioGroupFieldProps = {
  label: string;
  options: readonly RadioGroupFieldOption[];
  compact?: boolean;
  disabled?: boolean;
};

/** Opciones como tarjetas seleccionables; desde `sm` se reparten en una fila. */
export function RadioGroupField({ label, options, compact, disabled }: RadioGroupFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const selectedHint = options.find((option) => option.value === field.state.value)?.hint;

  return (
    // El legend queda fuera del flex: su margen lo separa de las opciones como el de un rótulo de campo compacto.
    <FieldSet data-invalid={isInvalid} className={cn(compact && "has-[>[data-slot=radio-group]]:gap-1.5")}>
      <FieldLegend
        variant="label"
        className={cn(compact && [COMPACT_FIELD_LABEL_CLASS_NAME, "mb-1.5 data-[variant=label]:text-[11px]"])}
      >
        {label}
      </FieldLegend>
      <RadioGroup
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        disabled={disabled}
        className={cn("sm:auto-cols-fr sm:grid-flow-col", compact && "gap-2")}
      >
        {options.map((option) => {
          const id = `${field.name}-${option.value}`;

          return (
            <FieldLabel
              key={option.value}
              htmlFor={id}
              className={cn(
                "bg-card not-has-data-[state=checked]:hover:border-primary/40 cursor-pointer transition-colors",
                compact && "[&>*]:data-[slot=field]:px-3 [&>*]:data-[slot=field]:py-2.5",
              )}
            >
              <Field orientation="horizontal" data-invalid={isInvalid} data-disabled={disabled}>
                <RadioGroupItem value={option.value} id={id} aria-invalid={isInvalid} />
                <FieldTitle>{option.label}</FieldTitle>
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>
      {selectedHint && <FieldDescription className={cn(compact && "text-xs")}>{selectedHint}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} className={cn(compact && "text-xs")} />}
    </FieldSet>
  );
}
