import z from "zod";

export const $loginSchema = z.object({
  email: z.email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginSchema = z.infer<typeof $loginSchema>;
