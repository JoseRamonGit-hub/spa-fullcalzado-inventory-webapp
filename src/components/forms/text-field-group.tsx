import { useFieldContext } from "@/hooks/form";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../ui/input-group";
import { FieldWrapper, type FormFieldProps } from "./field-wrapper";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TextFieldGroupProps = FormFieldProps &
  React.ComponentProps<"input"> & {
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
    passwordEye?: boolean;
  };

export function TextFieldGroup({
  label,
  description,
  leftAddon,
  rightAddon,
  action,
  descriptionBelow,
  passwordEye,
  ...props
}: TextFieldGroupProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const [showPassword, setShowPassword] = useState(false);

  return (
    <FieldWrapper label={label} description={description} action={action} descriptionBelow={descriptionBelow}>
      <InputGroup>
        <InputGroupInput
          {...props}
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          type={showPassword ? "text" : props.type}
          className={cn(props.className, showPassword && field.state.value && "tracking-normal")}
        />

        {leftAddon && <InputGroupAddon align={"inline-start"}>{leftAddon}</InputGroupAddon>}

        {rightAddon && <InputGroupAddon align={"inline-end"}>{rightAddon}</InputGroupAddon>}

        {passwordEye && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={() => setShowPassword((state) => !state)}>
              {showPassword ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </FieldWrapper>
  );
}
