import { useState } from "react";
import { useFieldContext } from "@/hooks/form";
import { Input } from "../ui/input";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";

type NumberFieldProps = FormFieldProps & React.ComponentProps<"input">;

function formatDisplayValue(value: number) {
  return value ? String(value) : "";
}

export function NumberField({ label, description, compact, ...props }: NumberFieldProps) {
  const field = useFieldContext<number>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [display, setDisplay] = useState(() => ({
    formValue: field.state.value,
    text: formatDisplayValue(field.state.value),
  }));

  if (display.formValue !== field.state.value) {
    setDisplay({
      formValue: field.state.value,
      text: formatDisplayValue(field.state.value),
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const formValue = text === "" ? 0 : Number(text);

    setDisplay({ formValue, text });
    field.handleChange(formValue);
  };

  return (
    <FieldWrapper label={label} description={description} compact={compact}>
      <Input
        {...props}
        id={field.name}
        name={field.name}
        type="number"
        value={display.text}
        onBlur={field.handleBlur}
        onChange={handleChange}
        aria-invalid={isInvalid}
      />
    </FieldWrapper>
  );
}
