import { type AnyFormOptions, createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { TextField } from "@/components/forms/text-field";
import { TextFieldGroup } from "@/components/forms/text-field-group";
import { handleFormFocusError } from "@/utils/form-focus";
import { NumberField } from "@/components/forms/number-field";
import { LoginSubscribeButton } from "@/components/login-subscribe-button";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

const { useAppForm: useBaseAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    TextFieldGroup,
    NumberField,
  },
  formComponents: {
    LoginButton: LoginSubscribeButton,
  },
  fieldContext,
  formContext,
});

const useAppForm: typeof useBaseAppForm = (options: AnyFormOptions) => {
  return useBaseAppForm({
    ...options,
    onSubmitInvalid: (props) => {
      handleFormFocusError();

      if (options?.onSubmitInvalid) {
        options.onSubmitInvalid(props);
      }
    },
  });
};

export { useAppForm, useFieldContext, useFormContext };
