import { Textarea } from "@/components/ui/textarea";
import { useFieldContext } from "@/hooks/form";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";

type TextareaFieldProps = FormFieldProps & React.ComponentProps<"textarea">;

export function TextareaField({ label, description, action, descriptionBelow, compact, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FieldWrapper
      label={label}
      description={description}
      action={action}
      descriptionBelow={descriptionBelow}
      compact={compact}
    >
      <Textarea
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
      />
    </FieldWrapper>
  );
}
