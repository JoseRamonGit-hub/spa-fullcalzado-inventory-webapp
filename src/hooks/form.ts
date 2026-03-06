import { type AnyFormOptions, createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { TextField } from "@/components/forms/text-field";
import { TextFieldGroup } from "@/components/forms/text-field-group";
import { handleFormFocusError } from "@/utils/form-focus";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

const { useAppForm: useBaseAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    TextFieldGroup,
  },
  formComponents: {},
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
