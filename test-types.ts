import { createFormHook } from "@tanstack/react-form";
type T = ReturnType<typeof createFormHook>;
// @ts-ignore
type Keys = keyof T;
