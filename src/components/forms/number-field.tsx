import { useState, useEffect } from "react";
import { useFieldContext } from "@/hooks/form";
import { Input } from "../ui/input";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";

type NumberFieldProps = FormFieldProps & React.ComponentProps<"input"> & {};

export function NumberField({ label, description, compact, ...props }: NumberFieldProps) {
  const field = useFieldContext<number>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [displayValue, setDisplayValue] = useState<string>(field.state.value ? String(field.state.value) : "");

  // Sync displayValue when form value changes externally (e.g. form reset)
  useEffect(() => {
    setDisplayValue((prev) => {
      const prevNum = prev === "" ? 0 : Number(prev);
      if (prevNum === field.state.value) return prev;
      return field.state.value ? String(field.state.value) : "";
    });
  }, [field.state.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayValue(val);
    field.handleChange(val === "" ? 0 : Number(val));
  };

  return (
    <FieldWrapper label={label} description={description} compact={compact}>
      <Input
        {...props}
        id={field.name}
        name={field.name}
        type="number"
        value={displayValue}
        onBlur={field.handleBlur}
        onChange={handleChange}
        aria-invalid={isInvalid}
      />
    </FieldWrapper>
  );
}
