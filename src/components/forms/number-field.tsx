import { useFieldContext } from "@/hooks/form";
import { Input } from "../ui/input";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";

type NumberFieldProps = FormFieldProps & React.ComponentProps<"input"> & {};

export function NumberField({ label, description, ...props }: NumberFieldProps) {
  const field = useFieldContext<number>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  // Manejador que convierte el input string a number
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      field.handleChange(0);
    } else {
      field.handleChange(Number(val));
    }
  };

  return (
    <FieldWrapper label={label} description={description}>
      <Input
        {...props}
        id={field.name}
        name={field.name}
        type="number"
        value={field.state.value === 0 && !field.state.meta.isTouched ? "" : field.state.value}
        onBlur={field.handleBlur}
        onChange={handleChange}
        aria-invalid={isInvalid}
      />
    </FieldWrapper>
  );
}
