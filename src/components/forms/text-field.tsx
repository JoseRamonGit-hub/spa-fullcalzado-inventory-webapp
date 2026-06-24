import { useFieldContext } from "@/hooks/form";
import { Input } from "../ui/input";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";

type TextFieldProps = FormFieldProps & React.ComponentProps<"input">;

export function TextField({ label, description, compact, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FieldWrapper label={label} description={description} compact={compact}>
      <Input
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
    </FieldWrapper>
  );
}
