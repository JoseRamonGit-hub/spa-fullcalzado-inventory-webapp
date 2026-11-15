import { useStore } from "@tanstack/react-form";
import { useAppForm } from "@/hooks/form";
import { requiredFieldOptions } from "@/utils/form-validators";

type CasheaNoteFieldOptions = {
  requiredMessage: string;
  placeholder: string;
  disabled: boolean;
};

export function useCasheaNoteField({ requiredMessage, placeholder, disabled }: CasheaNoteFieldOptions) {
  const form = useAppForm({ defaultValues: { note: "" } });
  const note = useStore(form.store, (state) => state.values.note.trim());

  const noteField = (
    <form.AppField name="note" {...requiredFieldOptions(requiredMessage)}>
      {(field) => <field.TextareaField label="Nota" placeholder={placeholder} rows={3} disabled={disabled} compact />}
    </form.AppField>
  );

  return { note, noteField };
}
