type BlurredField = { fieldApi: { validate: (cause: "change") => unknown } };

/** Listener `onBlur` de `form.AppField`: un campo obligatorio que se deja vacío muestra su error al salir de él. */
export function validateOnBlur({ fieldApi }: BlurredField) {
  fieldApi.validate("change");
}

export function requiredValue(message: string) {
  return ({ value }: { value: string }) => (value.trim() ? undefined : message);
}
