import { useRef, useState } from "react";
import { CircleAlert, Clock, TriangleAlert } from "lucide-react";
import { useAppForm } from "@/hooks/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { $loginSchema, type LoginSchema } from "../schemas";
import { getLastLoginEmail } from "../utils/login-utils";
import { HeaderLoginForm, LoginBrand } from "./header-login-form";
import { LoginSubmitButton } from "./login-submit-button";

type LoginFormProps = {
  onSubmit: (data: LoginSchema, options: { onError: () => void }) => void;
  isPending: boolean;
  error: Error | null;
  sessionExpired: boolean;
};

// Only autofocus with a mouse/trackpad: on phones it would pop the keyboard over the brand band.
const canAutoFocus = typeof window !== "undefined" && !!window.matchMedia?.("(pointer: fine)").matches;

export function LoginForm({ onSubmit, isPending, error, sessionExpired }: LoginFormProps) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [lastEmail] = useState(getLastLoginEmail);

  const form = useAppForm({
    defaultValues: {
      email: lastEmail,
      password: "",
    } satisfies LoginSchema as LoginSchema,
    validators: {
      onSubmit: $loginSchema,
    },
    onSubmit: async ({ value }) =>
      onSubmit(value, {
        // Keep the email, clear the wrong password and put the cursor back on it.
        onError: () => {
          form.setFieldValue("password", "");
          passwordRef.current?.focus();
        },
      }),
  });

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLockOn(e.getModifierState("CapsLock"));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="bg-card flex flex-col px-6 py-7 sm:px-10 md:px-14 md:py-10"
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 md:gap-10">
        <LoginBrand />

        <div className="flex flex-1 flex-col justify-center gap-7">
          <HeaderLoginForm />

          {sessionExpired && !error && (
            <Alert className="bg-secondary/60">
              <Clock />
              <AlertTitle>Tu sesión expiró</AlertTitle>
              <AlertDescription>Vuelve a entrar para continuar donde estabas.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5">
            {/* Email */}
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label="Correo electrónico"
                  type="email"
                  inputMode="email"
                  placeholder="nombre@correo.com"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus={canAutoFocus && !lastEmail}
                  className="h-11"
                />
              )}
            </form.AppField>

            {/* Password */}
            <form.AppField name="password">
              {(field) => (
                <field.TextFieldGroup
                  ref={passwordRef}
                  label="Contraseña"
                  type="password"
                  placeholder="Tu contraseña"
                  passwordEye={true}
                  autoComplete="current-password"
                  autoFocus={canAutoFocus && !!lastEmail}
                  onKeyDown={handleCapsLock}
                  onKeyUp={handleCapsLock}
                  onBlurCapture={() => setCapsLockOn(false)}
                  groupClassName="h-11"
                  // The group already draws the border, focus ring and invalid state.
                  className="h-full border-0"
                  action={
                    capsLockOn && (
                      <p className="text-foreground flex items-center gap-1.5 text-xs" role="status">
                        <TriangleAlert className="text-warning size-3.5" aria-hidden="true" />
                        Bloq Mayús está activado
                      </p>
                    )
                  }
                />
              )}
            </form.AppField>
          </div>

          {error && !isPending && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <CircleAlert />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <form.AppForm>
            <LoginSubmitButton isPending={isPending} />
          </form.AppForm>
        </div>

        <p className="text-muted-foreground text-xs text-pretty">
          ¿Olvidaste tu contraseña o no tienes acceso? Pide al administrador del negocio que te habilite.
        </p>
      </div>
    </form>
  );
}
