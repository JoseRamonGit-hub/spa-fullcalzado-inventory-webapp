import type { ReactNode } from "react";
import {
  Field,
  FieldContent,
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
  description?: ReactNode;
};

type RadioGroupFieldProps = {
  label: string;
  options: readonly RadioGroupFieldOption[];
  compact?: boolean;
  disabled?: boolean;
  className?: string;
};

export function RadioGroupField({ label, options, compact, disabled, className }: RadioGroupFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FieldSet data-invalid={isInvalid} disabled={disabled}>
      <FieldLegend variant="label" className={cn(compact && [COMPACT_FIELD_LABEL_CLASS_NAME, "mb-0"])}>
        {label}
      </FieldLegend>
      <RadioGroup
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        disabled={disabled}
        className={className}
      >
        {options.map((option) => {
          const id = `${field.name}-${option.value}`;

          return (
            <FieldLabel key={option.value} htmlFor={id}>
              <Field orientation="horizontal" data-invalid={isInvalid}>
                <RadioGroupItem value={option.value} id={id} aria-invalid={isInvalid} />
                <FieldContent>
                  <FieldTitle>{option.label}</FieldTitle>
                  {option.description && <FieldDescription>{option.description}</FieldDescription>}
                </FieldContent>
              </Field>
            </FieldLabel>
          );
        })}
      </RadioGroup>
      {isInvalid && <FieldError errors={field.state.meta.errors} className={compact ? "text-xs" : undefined} />}
    </FieldSet>
  );
}
