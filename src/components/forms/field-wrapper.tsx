import { useFieldContext } from "@/hooks/form";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import type { VariantProps } from "class-variance-authority";

export type FormFieldProps = {
  label: string;
  description?: string;
  action?: React.ReactNode;
  descriptionBelow?: boolean;
};

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
}: FieldWrapperProps) {
  const field = useFieldContext();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const errorElement = isInvalid && <FieldError errors={field.state.meta.errors} />;

  return (
    <Field data-invalid={isInvalid} orientation={orientation}>
      <FieldContent>
        {descriptionBelow ? (
          <>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {children}
            {errorElement}
            <FieldDescription>{description}</FieldDescription>
            {action}
          </>
        ) : (
          <>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <FieldDescription>{description}</FieldDescription>
            {children}
            {errorElement}
            {action}
          </>
        )}
      </FieldContent>
    </Field>
  );
}
