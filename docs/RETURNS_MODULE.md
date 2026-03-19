# Módulo de Devoluciones

## Base de datos

### Tablas

**`returns`** — cabecera de cada operación de devolución/cambio
```sql
id, type (exchange|refund), credit_usd, credit_ves, difference_usd, difference_ves,
exchange_rate, user_id, date, time, created_at, notes
```

**`return_items`** — artículos que el cliente devuelve (1:N con `returns`)
```sql
id, return_id, product_id, quantity, price_usd, price_ves
```

**`transactions.return_id`** — FK opcional a `returns`. Marca las transacciones de venta que son parte de un cambio (artículos que salen hacia el cliente como sustitución).

**`inventory_movements.return_id`** — FK opcional a `returns`. Añadido en la última migración para trazar qué movimientos pertenecen a una devolución/cambio.

### Enums
- `return_types`: `exchange` | `refund`
- `movement_types`: `entry` | `exit` | `return`

### Triggers

**`process_return_item()`** — se dispara al insertar en `return_items`:
1. Incrementa `products.stock += quantity`
2. Inserta en `inventory_movements` con `type = 'return'` y `return_id`

**`process_sale_transaction()`** — se dispara al insertar en `transactions`:
1. Decrementa `products.stock -= quantity`
2. Inserta en `inventory_movements` con `type = 'exit'` y propaga `return_id` si la transacción es parte de un cambio

Ambos tienen guard `IF pg_trigger_depth() > 1 THEN RETURN NEW` para evitar recursión.

### RPC `process_return()`

Función atómica que ejecuta todo en una sola transacción:
1. Calcula crédito (suma de artículos devueltos) y total nuevo (artículos de cambio)
2. Valida permisos: empleados no pueden procesar reembolsos ni diferencias negativas
3. Inserta `returns` (cabecera)
4. Inserta cada `return_item` → dispara `process_return_item()` (stock + movimiento)
5. Para cambios: inserta cada transacción nueva → dispara `process_sale_transaction()` (stock − movimiento)

### Migraciones
```
20260312023153_remote_schema.sql             — schema inicial
20260319022257_add_stock_sync_trigger...sql  — guard anti-recursión entry movements
20260319180000_returns_module.sql            — módulo completo de devoluciones
20260319200000_add_return_id_to_movements.sql — return_id en inventory_movements + triggers actualizados
```

---

## Capa de servicios y hooks

### `src/services/returnsService.ts`
```ts
returnsService.getAll(date?)   // SELECT con return_items→products, transactions→products, users
returnsService.processReturn(payload)  // llama al RPC process_return
```

El select anidado de `getAll`:
```
*, users(fullname), return_items(*, products(code, description)), transactions(*, products(code, description))
```

### `src/features/returns/hooks/useReturns.ts`
```ts
useReturns(date?)     // useQuery → returnsService.getAll, key: ["returns","list",{date}]
useCreateReturn()     // useMutation → returnsService.processReturn
                      // onSuccess: invalida products, transactions, movements, returns
```

### `src/types/index.ts` — tipos relevantes
```ts
ReturnItemWithProduct       = ReturnItem & { products: {code, description} }
ReturnTransactionWithProduct = Transaction & { products: {code, description} }
ReturnWithRelations         = Return & { users, return_items, transactions }
ProcessReturnPayload        // payload tipado para el RPC
```

---

## Frontend

### Modal de Devolución (`src/components/modals/return-modal/`)

Rediseño completo del modal original. Estructura actual:

**Layout**: `ResponsiveModal` con tabs estilo InModal (`-mx-6 -mt-6`, `rounded-none border-x-0 border-t-0`).

**Tabs**:
- `Devolución` (`Alt+D`) — buscar y agregar artículos que el cliente devuelve
- `Cambio` (`Alt+C`) — buscar y agregar artículos nuevos para el cliente

**Atajos de teclado**: `Shift+Enter` para confirmar, `Alt+D`/`Alt+C` para cambiar tab.

**Componentes**:
| Archivo | Responsabilidad |
|---|---|
| `index.tsx` | Orquestador: tabs, shortcuts, estado, modal |
| `components/product-return-form.tsx` | Formulario búsqueda de producto + cantidad con `autoFocus` al montar |
| `components/return-items-panel.tsx` | Lista agrupada de artículos (Devolución / Cambio) con cabeceras sticky |
| `components/return-summary-footer.tsx` | Grid compacto: Tasa, Crédito (USD + VES), N.Compra (USD + VES), Diferencia + notas + botón |
| `components/confirm-return-dialog.tsx` | AlertDialog de confirmación con desglose completo |
| `hooks/use-pending-return.ts` | Estado pendiente: returnItems[], exchangeItems[], totales derivados |
| `hooks/use-submit-return.ts` | Construye payload y llama useCreateReturn |
| `types/index.ts` | PendingReturnItem, PendingExchangeItem |

**Footer compacto**: grid unificado (`grid-cols-3 md:grid-cols-4` para cambio, `grid-cols-3` para reembolso). Muestra Bs junto a USD en Crédito y N.Compra.

---

### Página de Devoluciones (`src/features/returns/`)

Nueva página en `/returns`. Sigue el patrón de la página de Movimientos.

**Archivos creados**:
```
page.tsx                          — usa useReturns + DataTable con renderSubRow
columns.tsx                       — columnas: expand, tipo, fecha, hora, artículos, crédito, diferencia, notas, usuario
components/topbar.tsx             — DatePickerFilter + título "Devoluciones"
components/expanded-return-row.tsx — detalle inline al expandir una fila
```

**Columnas**:
| Columna | Móvil |
|---|---|
| Chevron expandible | ✓ |
| Badge Tipo (Cambio/Devolución) | ✓ |
| Fecha | oculta |
| Hora | oculta |
| Artículos (ej. `1 dev. / 1 camb.`) | ✓ |
| Crédito USD | ✓ |
| Diferencia USD (verde/rojo) | ✓ |
| Notas (truncadas) | oculta |
| Usuario | oculta |

**Fila expandible**: click en cualquier fila muestra `ExpandedReturnRow` con:
- Lista de artículos devueltos (código, descripción, cant., total USD)
- Lista de artículos de cambio (ídem), si aplica
- Resumen: Crédito USD + VES, Diferencia, Notas (en itálica)

---

### DataTable extendido (`src/components/ui/data-table.tsx`)

Prop opcional `renderSubRow`:
```ts
renderSubRow?: (row: Row<TData>) => React.ReactNode
```

Cuando se provee:
- Activa `getExpandedRowModel()` y `getRowCanExpand: () => true`
- Click en la fila llama `row.toggleExpanded()`
- Renderiza la sub-fila con `.flatMap()` inmediatamente debajo de la fila expandida
- Cursor `pointer` en filas automáticamente

---

### Movimientos (`src/features/movements/columns.tsx`)

La columna **Tipo** ahora distingue 4 estados:

| Condición | Badge | Color |
|---|---|---|
| `type = 'entry'` | Entrada | verde |
| `type = 'return'` | Devolución | naranja |
| `type = 'exit'` + `return_id` | Cambio | naranja |
| `type = 'exit'` sin `return_id` | Salida | rojo |

Depende del campo `return_id` recién agregado a `inventory_movements`.

---

### Navegación

**Sidebar** (`app-sidebar.tsx`): "Devoluciones" con `IterationCcw` entre "Ventas" y "Cierres de Caja".

**Mobile menu** (`mobile-menu-sheet.tsx`): "Devoluciones" como primera opción del `secondaryNav`.

**Ruta**: `src/routes/_app/returns.tsx` — thin wrapper sobre `ReturnsPage`.

---

## Reglas de negocio

| Regla | Dónde se valida |
|---|---|
| Empleados no pueden procesar reembolsos | RPC (DB) + `use-submit-return.ts` (UX) |
| Empleados no pueden procesar diferencias negativas | RPC (DB) + `use-submit-return.ts` (UX) |
| `exchange` requiere al menos 1 artículo devuelto | `use-pending-return.ts` |
| Stock se actualiza atómicamente | Triggers en DB |
| Movimientos y transacciones llevan `return_id` | Triggers actualizados en última migración |
