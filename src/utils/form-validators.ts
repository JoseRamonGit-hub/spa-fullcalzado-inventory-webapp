type BlurredField = { fieldApi: { validate: (cause: "change") => unknown } };

export function validateOnBlur({ fieldApi }: BlurredField) {
  fieldApi.validate("change");
}

export function requiredFieldOptions(message: string) {
  return {
    validators: { onChange: ({ value }: { value: string }) => (value.trim() ? undefined : message) },
    listeners: { onBlur: validateOnBlur },
  };
}

export function draftFieldOptions<TDraft, TName extends keyof TDraft>(
  name: TName,
  getDraft: () => TDraft,
  getFieldErrors: (draft: TDraft) => Partial<Record<keyof TDraft, string>>,
) {
  return {
    name,
    validators: {
      onChange: ({ value }: { value: TDraft[TName] }) => getFieldErrors({ ...getDraft(), [name]: value })[name],
    },
    listeners: { onBlur: validateOnBlur },
  };
}
