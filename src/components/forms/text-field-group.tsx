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
    groupClassName?: string;
  };

export function TextFieldGroup({
  label,
  description,
  leftAddon,
  rightAddon,
  action,
  descriptionBelow,
  compact,
  hideErrorMessage,
  passwordEye,
  groupClassName,
  ...props
}: TextFieldGroupProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const [showPassword, setShowPassword] = useState(false);

  return (
    <FieldWrapper
      label={label}
      description={description}
      action={action}
      descriptionBelow={descriptionBelow}
      compact={compact}
      hideErrorMessage={hideErrorMessage}
    >
      <InputGroup className={groupClassName}>
        <InputGroupInput
          {...props}
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          type={showPassword ? "text" : props.type}
          className={cn(
            props.className,
            // Con prefijo, el borde lo pone el grupo; el del input dibujaba una caja dentro de otra.
            leftAddon && "rounded-none border-0",
            showPassword && field.state.value && "tracking-normal",
          )}
        />

        {leftAddon && <InputGroupAddon align={"inline-start"}>{leftAddon}</InputGroupAddon>}

        {rightAddon && <InputGroupAddon align={"inline-end"}>{rightAddon}</InputGroupAddon>}

        {passwordEye && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((state) => !state)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </FieldWrapper>
  );
}
