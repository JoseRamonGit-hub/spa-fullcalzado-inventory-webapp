import { z } from "zod";

const roleSchema = z.enum(["employee", "admin"]);
const businessIdSchema = z.guid("Selecciona un negocio válido.");

const baseUserFormSchema = z
  .object({
    fullname: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es requerido.")
      .refine((value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), "Correo electrónico inválido.")
      .transform((value) => value.toLowerCase()),
    role: roleSchema,
    is_active: z.boolean(),
    business_ids: z.array(businessIdSchema),
    default_business_id: businessIdSchema,
  })
  .superRefine((value, ctx) => {
    if (value.role !== "admin" && value.business_ids.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["business_ids"],
        message: "Un empleado debe tener al menos un negocio asignado.",
      });
    }

    if (value.business_ids.length > 0 && !value.business_ids.includes(value.default_business_id)) {
      ctx.addIssue({
        code: "custom",
        path: ["default_business_id"],
        message: "El negocio predeterminado debe estar dentro de los negocios asignados.",
      });
    }
  });

export const $createUserFormSchema = baseUserFormSchema.extend({
  password: z.string().trim().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export const $updateUserFormSchema = baseUserFormSchema.extend({
  password: z.string(),
});

export type CreateUserFormValues = z.input<typeof $createUserFormSchema>;
export type UpdateUserFormValues = z.input<typeof $updateUserFormSchema>;
export type UserFormValues = CreateUserFormValues | UpdateUserFormValues;
export type ParsedCreateUserFormValues = z.output<typeof $createUserFormSchema>;
export type ParsedUpdateUserFormValues = z.output<typeof $updateUserFormSchema>;

export function parseUserFormValues(values: UserFormValues, isEditing: boolean) {
  return isEditing ? $updateUserFormSchema.safeParse(values) : $createUserFormSchema.safeParse(values);
}
