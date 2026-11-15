type BlurredField = { fieldApi: { validate: (cause: "change") => unknown } };

export function validateOnBlur({ fieldApi }: BlurredField) {
  fieldApi.validate("change");
}

export function requiredText(message: string) {
  return ({ value }: { value: string }) => (value.trim() ? undefined : message);
}
