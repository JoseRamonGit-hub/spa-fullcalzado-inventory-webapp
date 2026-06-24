import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ShieldCheck, Store, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useAppForm } from "@/hooks/form";
import type { Business, CreateUserInput, ManagedUser, UpdateUserInput, UserRole } from "@/types";
import { toast } from "sonner";
import { BusinessAssignmentField } from "./business-assignment-field";
import { $createUserFormSchema, $updateUserFormSchema, parseUserFormValues, type UserFormValues } from "../schemas";
import { getUserRoleLabel } from "../utils/user-labels";

type UserFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businesses: Business[];
  user?: ManagedUser | null;
  onCreate: (input: CreateUserInput) => Promise<unknown>;
  onUpdate: (input: UpdateUserInput) => Promise<unknown>;
  isPending: boolean;
};

type FormSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
};

const ROLE_OPTIONS: UserRole[] = ["employee", "admin"];

function getInitialValues(user?: ManagedUser | null): UserFormValues {
  return {
    fullname: user?.fullname ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "employee",
    is_active: user?.is_active ?? true,
    business_ids: user?.business_ids ?? [],
    default_business_id: user?.default_business_id ?? "",
  };
}

function FormSection({ icon: Icon, title, description, children }: FormSectionProps) {
  return (
    <section className="border-border/70 grid gap-3 border-b px-1 py-5 last:border-b-0 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-heading text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function BusinessAssignmentPlaceholder() {
  return (
    <div className="flex min-h-32 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="bg-muted h-3 w-32 rounded" />
          <span className="bg-muted/70 h-2.5 w-56 max-w-full rounded" />
        </div>
        <span className="bg-muted size-6 rounded-md" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <span className="bg-card h-12 rounded-md border" />
        <span className="bg-card h-12 rounded-md border" />
      </div>
      <span className="bg-card h-20 rounded-md border" />
    </div>
  );
}

export function UserFormModal({
  open,
  onOpenChange,
  businesses,
  user,
  onCreate,
  onUpdate,
  isPending,
}: UserFormModalProps) {
  const isEditing = !!user;
  const [shouldRenderBusinessAccess, setShouldRenderBusinessAccess] = useState(false);
  const form = useAppForm({
    defaultValues: getInitialValues(user),
    validators: {
      onSubmit: isEditing ? $updateUserFormSchema : $createUserFormSchema,
    },
    onSubmit: async ({ value }) => {
      const parsed = parseUserFormValues(value, isEditing);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Revisa los datos del usuario.");
        return;
      }

      const values = parsed.data;

      if (isEditing && user) {
        await onUpdate({
          id: user.id,
          fullname: values.fullname,
          role: values.role,
          is_active: values.is_active,
          business_ids: values.business_ids,
          default_business_id: values.default_business_id,
        });
      } else {
        await onCreate({
          fullname: values.fullname,
          email: values.email,
          password: values.password,
          role: values.role,
          business_ids: values.business_ids,
          default_business_id: values.default_business_id,
        });
      }

      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      setShouldRenderBusinessAccess(false);
      return;
    }

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setShouldRenderBusinessAccess(true));
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-5 pt-4 pb-3 sm:px-6">
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-sm font-bold tracking-wide uppercase">
                {isEditing ? "Editar usuario" : "Nuevo usuario"}
              </DialogTitle>
              <DialogDescription>
                Gestiona credenciales, rol, acceso por negocio y tienda predeterminada.
              </DialogDescription>
            </div>
            {isEditing ? (
              <Badge variant={user?.is_active ? "success" : "destructive"} className="mt-0.5">
                {user?.is_active ? "Activo" : "Inactivo"}
              </Badge>
            ) : null}
          </div>
        </DialogHeader>

        <DialogBody className="bg-background max-h-[min(72dvh,42rem)] px-4 py-0 sm:px-6">
          <form
            id="user-form"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup className="gap-0">
              <FormSection
                icon={UserRound}
                title="Identidad"
                description={
                  isEditing
                    ? "El correo se mantiene fijo para evitar inconsistencias con Supabase Auth."
                    : "Estos datos crean el acceso inicial del usuario."
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <form.AppField name="fullname">
                    {(field) => <field.TextField label="Nombre" placeholder="María Admin" autoComplete="name" />}
                  </form.AppField>

                  <form.AppField name="email">
                    {(field) => (
                      <field.TextField
                        label="Correo electrónico"
                        type="email"
                        placeholder="usuario@tienda.com"
                        autoComplete="email"
                        disabled={isEditing}
                      />
                    )}
                  </form.AppField>
                </div>

                {!isEditing ? (
                  <div className="mt-3">
                    <form.AppField name="password">
                      {(field) => (
                        <field.TextFieldGroup
                          label="Contraseña temporal"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
                          passwordEye
                        />
                      )}
                    </form.AppField>
                  </div>
                ) : null}
              </FormSection>

              <FormSection
                icon={ShieldCheck}
                title="Permisos"
                description="El rol define el alcance general; el estado controla si puede operar dentro de la app."
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                  <form.AppField name="role">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Rol</FieldLabel>
                        <NativeSelect
                          id={field.name}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value as UserRole)}
                          wrapperClassName="w-full"
                          className="w-full"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <NativeSelectOption key={role} value={role}>
                              {getUserRoleLabel(role)}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <FieldDescription className="text-xs">
                          Admin ve todo; empleado opera solo negocios asignados.
                        </FieldDescription>
                      </Field>
                    )}
                  </form.AppField>

                  <form.AppField name="is_active">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                        {isEditing ? (
                          <NativeSelect
                            id={field.name}
                            value={field.state.value ? "active" : "inactive"}
                            onChange={(event) => field.handleChange(event.target.value === "active")}
                            wrapperClassName="w-full"
                            className="w-full"
                          >
                            <NativeSelectOption value="active">Activo</NativeSelectOption>
                            <NativeSelectOption value="inactive">Inactivo</NativeSelectOption>
                          </NativeSelect>
                        ) : (
                          <div className="bg-card flex h-9 items-center rounded-md border px-3 shadow-xs">
                            <Badge variant="success">Activo al crear</Badge>
                          </div>
                        )}
                        <FieldDescription className="text-xs">
                          Un usuario inactivo pierde acceso operativo e inicio válido en la app.
                        </FieldDescription>
                      </Field>
                    )}
                  </form.AppField>
                </div>
              </FormSection>

              <FormSection
                icon={Store}
                title="Acceso por negocio"
                description="Define en qué tiendas puede trabajar y cuál será su contexto inicial."
              >
                <form.Subscribe
                  selector={(state) => ({
                    values: state.values,
                    submissionAttempts: state.submissionAttempts,
                  })}
                >
                  {({ values, submissionAttempts }) => (
                    <form.AppField name="business_ids">
                      {(businessField) => (
                        <form.AppField name="default_business_id">
                          {(defaultBusinessField) =>
                            shouldRenderBusinessAccess ? (
                              <BusinessAssignmentField
                                businesses={businesses}
                                role={values.role}
                                selectedBusinessIds={businessField.state.value}
                                defaultBusinessId={defaultBusinessField.state.value}
                                onSelectedBusinessIdsChange={businessField.handleChange}
                                onDefaultBusinessIdChange={defaultBusinessField.handleChange}
                                businessErrors={businessField.state.meta.errors}
                                defaultBusinessErrors={defaultBusinessField.state.meta.errors}
                                showErrors={
                                  submissionAttempts > 0 ||
                                  businessField.state.meta.isTouched ||
                                  defaultBusinessField.state.meta.isTouched
                                }
                              />
                            ) : (
                              <BusinessAssignmentPlaceholder />
                            )
                          }
                        </form.AppField>
                      )}
                    </form.AppField>
                  )}
                </form.Subscribe>
              </FormSection>
            </FieldGroup>
          </form>
        </DialogBody>

        <DialogFooter
          className="justify-end"
          leftContent={
            isEditing
              ? "Los cambios aplican al próximo refresco de datos del usuario."
              : "Entrega la contraseña temporal fuera del sistema."
          }
        >
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" form="user-form" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar usuario"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
