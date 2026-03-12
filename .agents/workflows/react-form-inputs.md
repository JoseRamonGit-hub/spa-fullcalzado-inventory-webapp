---
description: Guía de Arquitectura de Formularios (useAppForm y Campos)
---

# Guía de Formularios y Componentes Visuales

Esta guía está destinada a proporcionar un estándar arquitectónico para el uso de formularios en el proyecto `spa-inventory-shoes-app`, en particular con **TanStack Form** y nuestros wrappers de componentes tipados fuertemente.

## Arquitectura Base

El proyecto utiliza `@tanstack/react-form` para manejar los formularios de manera reactiva, eficiente y con inferencia de tipos profundos. Para simplificar el uso y forzar la coherencia visual (Shadcn), extendemos TanStack Form mediante un context global en `src/hooks/form.ts`.

### Componentes de Campo (Field Components)

En lugar de renderizar `<input />` planos, tenemos wrappers predefinidos en `src/components/forms/`:

1. **`TextField`**: Para inputs de texto estándar (nombres, correos, etc).
2. **`TextFieldGroup`**: Para inputs con adornos, como iconos de revelado de contraseña u otros aditamentos.
3. **`NumberField`**: **Punto crítico:** Para todos los inputs numéricos (precios, stock). Este componente asegura que el string subyacente del input HTML se transforme automáticamente a un valor de tipo `number` antes de ser guardado en el estado general de TanStack Form.

#### ¿Por qué usar estos componentes?
Están atados al contexto `useFieldContext<T>()` que provee TanStack Form a través del `form.AppField`. Internamente, ellos ya gestionan su evento `onChange`, manejan eventos `onBlur`, muestran los mensajes de error al encontrarse inválidos o *touched* y renderizan el `Label` estándar.

## Cómo Usar Formularios Correctamente

Siempre que necesites un nuevo formulario, usa el hook custom `useAppForm` con este patrón básico:

### 1. Inicialización
```tsx
import { useAppForm } from "@/hooks/form";

const form = useAppForm({
  defaultValues: {
    description: "",
    price: "" as unknown as number, // Truco TypeScript: Inicia vacío pero el state requerirá un number explícito.
  },
  onSubmit: async ({ value }) => {
    // Aquí value.price será enteramente de tipo 'number' y seguro de usar con TanStack Query
    await myMutation.mutateAsync(value);
    form.reset();
  }
});
```

### 2. Renderizado de la etiqueta <form>
Debes prevenir el recargo por default y delegar la sumisión.
```tsx
<form
  onSubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }}
>
```

### 3. Registro de Campos
Cada campo necesita estar envuelto en `<form.AppField name="...">`. Los validadores síncronos se recomiendan para chequeos inmediatos (`onChange` o `onBlur`).

**Para Textos (`TextField`):**
```tsx
<form.AppField
  name="description"
  validators={{
    onChange: ({ value }) => (!value ? "La descripción es requerida" : undefined),
  }}
>
  {(field) => (
    <field.TextField
      label="Descripción del Producto"
      placeholder="Escribe aquí..."
      required
    />
  )}
</form.AppField>
```

**Para Números (`NumberField`):**
```tsx
<form.AppField
  name="price"
  validators={{
    onChange: ({ value }) => {
      if (value === undefined || value === null || String(value) === "") return "Requerido";
      if (value <= 0) return "El precio no puede ser negativo";
      return undefined;
    },
  }}
>
  {(field) => (
    <field.NumberField
      label="Precio"
      step="0.01"
      min="0"
      placeholder="0.00"
      required
      className="tabular-nums"
    />
  )}
</form.AppField>
```

*Nota:* Evita usar `labelClassName` ya que fue removido a favor de consistencia desde los props base. `field.NumberField` automáticamente interpreta y convierte el número, para que el `form.AppField` envíe el payload esperado a Prisma o el EndPoint sin fallas de `ParseInt/Float`.

### 4. Suscripción al Envío Visual
Suscribir selectores específicos previene renders masivos en el botón cada vez que alguien tipea algo.

```tsx
<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
  {([canSubmit, isSubmitting]) => (
    <Button 
      type="submit" 
      disabled={!canSubmit || isSubmitting}
    >
      {isSubmitting ? "Cargando..." : "Guardar"}
    </Button>
  )}
</form.Subscribe>
```

### Reglas de Oro de los IAs para el Futuro
- **NUNCA** uses componentes `<Input type="number" />` crudos si estás dentro del contexto de `useAppForm()`. Usa `form.AppField` + `field.NumberField`.
- **SIEMPRE** usa validadores síncronos (o `zodValidator` global) para impedir el submit.
- **CUIDADO** no modifiques o leas todos los values con `form.useStore((s) => s.values)` cerca del Top Level porque causará un hiper-render. Usa el patrón del "render-prop" de `form.AppField` o `<form.Subscribe>` para derivar o suscribir puntualmente a valores de otro campo.
