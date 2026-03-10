import { createFormHookContexts, createFormHook } from "@tanstack/react-form";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField: () => null,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

function Test() {
  const form = useAppForm({ defaultValues: { a: 1 }, onSubmit: () => {} });
  console.log("form properties:", Object.keys(form));
  // @ts-ignore
  if (form.components) console.log("form.components properties:", Object.keys(form.components));
  // @ts-ignore
  if (form.AppField) console.log("form.AppField exists", typeof form.AppField);
  return null;
}

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

try {
  renderToStaticMarkup(React.createElement(Test));
} catch (e) {
  console.error(e);
}
