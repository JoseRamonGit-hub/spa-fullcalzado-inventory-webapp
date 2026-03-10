import { createFormHook } from "@tanstack/react-form";
const res = createFormHook({
  fieldComponents: {},
  formComponents: {}
});
console.log(Object.keys(res));
