import { createFormHookContexts, createFormHook } from "@tanstack/react-form";
const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldComponents: { TextField: (props: { customA: string }) => null },
  formComponents: {}, fieldContext, formContext
});
const form = useAppForm({ defaultValues: { a: 1 } });
type Props = Parameters<typeof form.AppField>[0];
let p: Props = null as any;
