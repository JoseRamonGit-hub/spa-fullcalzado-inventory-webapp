Basada en el refactor de `/inventory`.

## 1. Hooks: separar queries de mutations

Cada feature debe tener archivos separados para queries y mutations.

```
hooks/
├── useProductQueries.ts    # query keys + useQuery hooks
├── useProductMutations.ts  # useMutation hooks
└── useProducts.test.tsx
```

- El query key factory vive en el archivo de queries.
- Las mutations importan las keys desde queries, nunca al revés.

## 2. Queries: producción-ready

```ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export function useProducts(date?: string) {
  return useQuery({
    queryKey: productKeys.list(date),
    queryFn: () => productsService.getAll(date),
    placeholderData: keepPreviousData, // evita flash de contenido vacío al cambiar filtros
  });
}
```

- Params opcionales (`id: string | undefined`) deben reflejarse en `enabled`:

```ts
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => productsService.getById(id!),
    enabled: !!id,
  });
}
```

## 3. Mutations: callbacks + toast.promise

Side effects van en callbacks de mutation, no en `.then()/.catch()`. `toast.promise` se mantiene para feedback visual.

```ts
const handleConfirm = () => {
  const promise = deleteProduct.mutateAsync(product.id, {
    onSuccess: () => onOpenChange(false),
  });

  toast.promise(promise, {
    loading: "Eliminando producto...",
    success: "Producto eliminado correctamente",
    error: "Error al eliminar el producto",
  });
};
```

## 4. Types sobre interfaces

Usar `type` en todo el proyecto. No usar `interface` para props, options, ni payloads.

## 5. Lógica de filtrado: extraer a hook

Cuando un componente acumula múltiples `useState` + `useMemo` para filtrado, extraer a un hook.

- **No mezclar query params (server-side) con filtros client-side.** `date` es un query param y se queda en el componente como `useState`; search/stock son filtros client-side y van en el hook.

## 6. Componentes inline: extraer si superan ~20 líneas de JSX

Drawers, popovers o secciones grandes que están inlined en el page deben ser componentes propios.

- Usar guards (`product && onEdit(product)`) en vez de non-null assertions (`product!`).

## 7. TanStack Table

### TableMeta por feature

Definir un type local en el archivo de columns, no inline casts:

```ts
// columns.tsx
export type InventoryTableMeta = {
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  isAdmin?: boolean;
};

// En la celda:
const meta = table.options.meta as InventoryTableMeta | undefined;
```

### getRowId

Siempre pasar `getRowId` al `DataTable` para evitar problemas con reconciliación de React:

```tsx
<DataTable getRowId={(row) => row.id} ... />
```

### Cast `as ColumnDef<T>[]`

El cast al final del array de `getColumns` es el patrón aceptado de TanStack Table para arrays con `columnHelper` (cada accessor tiene un `TValue` diferente que no unifica). No intentar reemplazar con `satisfies`.

## 8. Formularios (TanStack Form)

### Validators: onBlur + onChange condicional

No mostrar errores mientras el usuario escribe. Validar en `onBlur`, y en `onChange` solo si el campo ya fue tocado:

```ts
// Campos de texto
validators={{
  onBlur: ({ value }) => (!value.trim() ? "Requerido" : undefined),
  onChange: ({ value, fieldApi }) =>
    fieldApi.state.meta.isTouched && !value.trim() ? "Requerido" : undefined,
}}

// Campos numéricos — no validar undefined/null, NumberField siempre emite number (vacío → 0)
validators={{
  onBlur: ({ value }) => (value < 0 ? "Inválido" : undefined),
  onChange: ({ value, fieldApi }) =>
    fieldApi.state.meta.isTouched && value < 0 ? "Inválido" : undefined,
}}
```

### Two-step submission (form → confirm dialog)

El botón del form debe considerar `mutation.isPending` además de `form.isSubmitting`, porque la mutation ocurre fuera del ciclo del form:

```tsx
<Button disabled={!canSubmit || isSubmitting || updateProduct.isPending}>
```

## 9. Services

- Tipar retornos explícitamente. No usar `Promise<unknown>`.
- Si un RPC no retorna data útil, usar `Promise<void>` y no hacer `return data`.
- Eliminar métodos no usados (e.g. `update` si solo se usa `editProduct` vía RPC).

## 10. Query key factories: consistencia global

Todos los features deben usar factory pattern. No usar strings sueltos como `["exchangeRate"]`:

```ts
export const exchangeRateKeys = {
  all: ["exchangeRate"] as const,
  current: () => [...exchangeRateKeys.all, "current"] as const,
  history: () => [...exchangeRateKeys.all, "history"] as const,
};
```

## 11. Convenciones generales

- `selector` de Zustand inline para derivar valores: `useAuthStore((state) => state.user?.role === "admin")`.
- No destructurar valores del hook que no se usan en el componente.
- Nombres claros para estados con `useTransition`: `searchInput` (inmediato) / `deferredSearch` (diferido), no `search` / `filteredSearch`.
- Props de componentes internos deben ser requeridos, no opcionales defensivamente. Solo usar `?` si el componente se usa en contextos donde la prop es genuinamente opcional.
