import { useAppForm } from "@/hooks/form";
import { $loginSchema, type LoginSchema } from "../schemas";
import { HeaderLoginForm } from "./header-login-form";
import { LoginSubmitButton } from "./login-submit-button";

type LoginFormProps = {
  onSubmit: (data: LoginSchema) => void;
  isPending: boolean;
};

export function LoginForm({ onSubmit, isPending }: LoginFormProps) {
  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    } satisfies LoginSchema as LoginSchema,
    validators: {
      onSubmit: $loginSchema,
    },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="bg-card relative flex flex-col justify-center p-6 md:p-10"
    >
      <div className="flex flex-col gap-8">
        <HeaderLoginForm />

        <div className="grid gap-5">
          {/* Email */}
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Correo Electrónico"
                type="email"
                placeholder="admin@fullcalzado.com"
                autoComplete="email"
              />
            )}
          </form.AppField>

          {/* Password */}
          <form.AppField name="password">
            {(field) => (
              <field.TextFieldGroup
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                passwordEye={true}
                autoComplete="current-password"
              />
            )}
          </form.AppField>
        </div>

        {/* Submit */}
        <form.AppForm>
          <LoginSubmitButton isPending={isPending} />
        </form.AppForm>
      </div>
    </form>
  );
}
