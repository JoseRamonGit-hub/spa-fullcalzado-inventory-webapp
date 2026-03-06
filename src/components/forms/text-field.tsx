import { useFieldContext } from "@/hooks/form"
import { Input } from "../ui/input"
import { FieldWrapper, FormFieldProps } from "./field-wrapper"

type TextFieldProps = FormFieldProps & React.ComponentProps<"input"> & {}

export function TextField({ label, description, ...props }: TextFieldProps) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <FieldWrapper label={label} description={description}>
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
  )
}
