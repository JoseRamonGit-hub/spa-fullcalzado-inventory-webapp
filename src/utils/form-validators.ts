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
