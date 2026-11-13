import { useFieldContext } from "@/hooks/form";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import type { VariantProps } from "class-variance-authority";

export type FormFieldProps = {
  label: string;
  description?: string;
  action?: React.ReactNode;
  descriptionBelow?: boolean;
  compact?: boolean;
  hideErrorMessage?: boolean;
};

export const COMPACT_FIELD_LABEL_CLASS_NAME = "text-muted-foreground text-[11px] font-medium tracking-wider uppercase";

type FieldWrapperProps = FormFieldProps & {
  children: React.ReactNode;
  orientation?: VariantProps<typeof Field>["orientation"];
};
export function FieldWrapper({
  label,
  description,
  children,
  orientation = undefined,
  action,
  descriptionBelow,
  compact,
  hideErrorMessage = false,
}: FieldWrapperProps) {
  const field = useFieldContext();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const errorElement = !hideErrorMessage && isInvalid && (
    <FieldError errors={field.state.meta.errors} className={compact ? "text-xs" : undefined} />
  );

  // Sin descripción no se renderiza el <p> vacío: su margen depende de su posición y movía el control al aparecer el error.
  const descriptionElement = description && <FieldDescription>{description}</FieldDescription>;

  const labelElement = (
    <FieldLabel htmlFor={field.name} className={compact ? COMPACT_FIELD_LABEL_CLASS_NAME : undefined}>
      {label}
    </FieldLabel>
  );

  return (
    <Field data-invalid={isInvalid} orientation={orientation}>
      <FieldContent>
        {descriptionBelow ? (
          <>
            {labelElement}
            {children}
            {errorElement}
            {descriptionElement}
            {action}
          </>
        ) : (
          <>
            {labelElement}
            {descriptionElement}
            {children}
            {errorElement}
            {action}
          </>
        )}
      </FieldContent>
    </Field>
  );
}
