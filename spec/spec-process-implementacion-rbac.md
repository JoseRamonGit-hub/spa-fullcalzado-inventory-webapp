---
title: Plan de implementación RBAC para frontend y backend
version: 1.0
date_created: 2026-06-23
last_updated: 2026-06-23
owner: Anderson R. Román
tags:
  - process
  - rbac
  - frontend
  - supabase
  - security
  - users
---

# Introducción

Este documento define el plan de implementación de un sistema RBAC para la SPA de Full Calzado, con foco principal
en frontend y con autorización real respaldada por Supabase/PostgreSQL.

RBAC significa Role-Based Access Control: un modelo donde los usuarios tienen roles y los roles conceden permisos.
El frontend debe usar estos permisos para mostrar, ocultar, bloquear o redirigir acciones. La base de datos debe
seguir siendo la autoridad final para permitir o rechazar operaciones.

Este plan no implementa código. Define fases, archivos afectados, contratos esperados y criterios de aceptación.

## 1. Propósito y alcance

### 1.1 Propósito

Implementar un sistema RBAC eficiente, entendible y extensible que permita:

- Centralizar permisos de frontend.
- Eliminar comparaciones dispersas como `user.role === "admin"` fuera de una capa de autorización.
- Preparar la app para nuevos roles sin reescribir cada módulo.
- Integrar un módulo de gestión de usuarios exclusivo para administradores.
- Permitir que un usuario no administrador pueda tener acceso excepcional a más de un negocio.
- Mantener TanStack Query como fuente de verdad de datos de servidor en el frontend.
- Mantener Supabase RLS/RPC como frontera real de seguridad.

### 1.2 Dentro del alcance

- Capa RBAC frontend.
- Matriz de permisos inicial.
- Refactor de checks por rol existentes.
- Guardas de navegación, sidebar, bottom bar, modales y acciones.
- Módulo futuro de gestión de usuarios.
- Servicios, hooks y query keys para usuarios/permisos.
- Cambios de Supabase necesarios para soportar usuarios activos/inactivos, múltiples negocios y permisos coherentes.
- Nueva migración SQL cuando el backend cambie.
- Tests unitarios, integración frontend y SQL.

### 1.3 Fuera del alcance inicial

- Definir el nombre y permisos finales del tercer rol.
- Crear roles dinámicos editables desde UI.
- Sustituir Supabase Auth por otro proveedor.
- Exponer `service_role` en el navegador.
- Convertir la SPA en una app con backend propio.

## 2. Definiciones

| Término | Definición |
| --- | --- |
| Rol | Categoría asignada a un usuario. Actualmente: `admin` y `employee`. |
| Permiso | Capacidad semántica, por ejemplo `inventory.product.edit`. |
| RBAC | Control de acceso basado en roles. |
| Permiso efectivo | Permiso resultante del rol del usuario y su estado actual. |
| Negocio asignado | Negocio al que un usuario no administrador puede acceder. |
| Negocio predeterminado | Negocio que se selecciona al iniciar sesión si el usuario tiene acceso. |
| RLS | Row-Level Security de PostgreSQL. Restringe filas visibles o modificables. |
| RPC | Función PostgreSQL invocable desde Supabase client. |
| Gestión de usuarios | Módulo administrativo para crear, listar, desactivar y configurar accesos de usuarios. |

## 3. Estado actual confirmado

### 3.1 Roles actuales

El frontend obtiene el rol desde `user.role`, persistido en `useAuthStore`.

Archivo:

- `src/features/auth/store/useAuthStore.ts`

Tipos actuales:

- `src/types/supabase.ts`
- `src/types/index.ts`

El enum actual de Supabase solo contempla:

```ts
"admin" | "employee"
```

### 3.2 Checks por rol existentes

Actualmente los permisos están dispersos en estos archivos:

| Archivo | Uso actual |
| --- | --- |
| `src/features/business/hooks/useBusinessSwitcher.ts` | Permite cambiar negocio solo si `role === "admin"`. |
| `src/features/inventory/page.tsx` | Define `isAdmin` para abrir acciones móviles. |
| `src/features/inventory/columns.tsx` | Oculta acciones de editar/desactivar si no es admin. |
| `src/components/modals/return-modal/components/return-summary-footer.tsx` | Bloquea devoluciones/refunds para `employee`. |
| `src/features/settings/page.tsx` | Muestra asignación de negocios solo a admin. |
| `src/features/settings/hooks/useUserBusinessAccess.ts` | Filtra usuarios con `role === "employee"`. |

### 3.3 Backend actual relacionado

La migración multi-negocio contiene la base de autorización actual:

- `supabase/migrations/20260622153214_migrate_to_multi_business.sql`

Funciones relevantes:

- `private.current_user_role()`
- `private.is_admin()`
- `private.has_operational_role()`
- `private.has_business_access(uuid)`
- `private.can_write_business(uuid)`
- `private.assign_user_business(uuid, uuid)`

Tablas relevantes:

- `public.users`
- `public.businesses`
- `public.user_business_access`
- `public.products`
- `public.transactions`
- `public.returns`
- `public.exchange_rates`
- `public.app_settings`
- `public.cash_closes`

## 4. Principios obligatorios

- **REQ-001**: El frontend no debe ser considerado frontera de seguridad.
- **REQ-002**: Toda acción sensible debe estar protegida también por RLS, RPC o función SQL.
- **REQ-003**: El frontend debe consultar permisos mediante una API central, no comparar roles directamente.
- **REQ-004**: Los permisos deben ser semánticos, no nombres de componentes.
- **REQ-005**: TanStack Query debe manejar datos de servidor: usuarios, negocios, accesos y permisos efectivos.
- **REQ-006**: Zustand solo debe manejar estado cliente o de sesión local. No debe ser la fuente definitiva de permisos remotos.
- **REQ-007**: Un nuevo rol debe quedar sin permisos por defecto hasta que sea definido explícitamente.
- **REQ-008**: Un employee puede actualizar tasa de cambio y ver historial de tasa.
- **REQ-009**: La gestión de usuarios es exclusiva del admin.
- **REQ-010**: Un usuario no administrador puede tener acceso excepcional a más de un negocio.
- **REQ-011**: Todo usuario con más de un negocio accesible debe poder cambiar entre esos negocios si su rol permite operación.
- **SEC-001**: Nunca exponer `service_role` en la SPA.
- **SEC-002**: Crear usuarios de Supabase Auth desde un contexto seguro, por ejemplo Edge Function o backend confiable.
- **SEC-003**: Desactivar usuarios debe bloquear operaciones en base de datos aunque la sesión siga viva temporalmente.
- **SEC-004**: Toda migración que toque RLS/RPC debe revisar grants, `SECURITY DEFINER`, `search_path` y `WITH CHECK`.

## 5. Matriz de permisos objetivo inicial

El tercer rol queda pendiente. Debe añadirse de forma explícita en una fase futura. Hasta entonces, cualquier rol
desconocido debe recibir cero permisos funcionales.

| Permiso | Descripción | Admin | Employee | Futuro rol |
| --- | --- | ---: | ---: | ---: |
| `app.access` | Entrar a la app autenticada. | Sí | Sí | No definido |
| `business.viewAssigned` | Ver negocios accesibles. | Sí | Sí | No definido |
| `business.switchAccessible` | Cambiar entre negocios accesibles. | Sí | Sí, si tiene más de uno | No definido |
| `inventory.view` | Ver inventario. | Sí | Sí | No definido |
| `inventory.product.create` | Crear productos. | Sí | Sí | No definido |
| `inventory.stock.add` | Añadir stock. | Sí | Sí | No definido |
| `inventory.product.edit` | Editar producto. | Sí | No | No definido |
| `inventory.product.toggleStatus` | Activar/desactivar producto. | Sí | No | No definido |
| `inventory.movements.view` | Ver movimientos. | Sí | Sí | No definido |
| `sales.view` | Ver ventas. | Sí | Sí | No definido |
| `sales.create` | Registrar venta. | Sí | Sí | No definido |
| `returns.view` | Ver devoluciones. | Sí | Sí | No definido |
| `returns.exchange.create` | Registrar cambio. | Sí | Sí | No definido |
| `returns.refund.create` | Registrar devolución con salida de dinero. | Sí | No | No definido |
| `returns.favorableBalance.create` | Registrar cambio con saldo a favor del cliente. | Sí | No | No definido |
| `cashCloses.view` | Ver cierres de caja. | Sí | Sí | No definido |
| `cashCloses.generate` | Generar cierre de caja. | Sí | Sí | No definido |
| `exchangeRates.view` | Ver tasa vigente. | Sí | Sí | No definido |
| `exchangeRates.history.view` | Ver historial de tasa. | Sí | Sí | No definido |
| `exchangeRates.update` | Actualizar tasa manual. | Sí | Sí | No definido |
| `settings.view` | Ver pantalla de ajustes. | Sí | Sí | No definido |
| `users.view` | Ver usuarios registrados. | Sí | No | No definido |
| `users.create` | Crear usuarios. | Sí | No | No definido |
| `users.deactivate` | Desactivar/reactivar usuarios. | Sí | No | No definido |
| `users.assignBusinesses` | Asignar tiendas a usuarios. | Sí | No | No definido |
| `users.setDefaultBusiness` | Definir tienda predeterminada de un usuario. | Sí | No | No definido |
| `users.manage` | Acceso general al módulo de gestión de usuarios. | Sí | No | No definido |

## 6. Arquitectura frontend objetivo

### 6.1 Capa central de permisos

Crear una carpeta dedicada:

- `src/features/auth/permissions/`

Archivos propuestos:

| Archivo | Responsabilidad |
| --- | --- |
| `src/features/auth/permissions/permissions.ts` | Define el union type `Permission` y catálogo de permisos. |
| `src/features/auth/permissions/role-permissions.ts` | Mapea roles conocidos a permisos. |
| `src/features/auth/permissions/useCan.ts` | Hook para consultar permisos del usuario actual. |
| `src/features/auth/permissions/PermissionGate.tsx` | Componente para render condicional por permiso. |
| `src/features/auth/permissions/assertPermission.ts` | Helper para guardas y handlers no visuales. |
| `src/features/auth/permissions/index.ts` | Barrel export interno de la capa RBAC. |

Reglas:

- Fuera de esta carpeta no debe haber checks directos como `role === "admin"` para autorización funcional.
- El rol puede mostrarse como dato visual, pero no debe decidir permisos fuera de la capa RBAC.
- Los permisos deben usar nombres de dominio: `inventory.product.edit`, no `showEditButton`.

### 6.2 Hook de permisos

Contrato esperado:

```ts
type UseCanResult = {
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  permissions: ReadonlySet<Permission>;
};
```

Fuente inicial:

- `src/features/auth/store/useAuthStore.ts`

Evolución recomendada:

- Consultar permisos efectivos desde TanStack Query si el backend expone una RPC como `get_my_permissions`.
- Mantener el mapa frontend como fallback tipado y como contrato de UI.

### 6.3 Guardas visuales y de navegación

Aplicar permisos en:

- Navegación desktop: `src/components/layout/app-sidebar.tsx`
- Navegación mobile: `src/components/layout/bottom-bar.tsx`
- Menú mobile: `src/components/layout/mobile-menu-sheet.tsx`
- Acciones rápidas mobile: `src/components/layout/mobile-quick-actions-drawer.tsx`
- Layout autenticado: `src/components/layout/app-layout.tsx`
- Rutas autenticadas: `src/routes/_app/*.tsx`

Reglas:

- Si un usuario no tiene permiso para un módulo, el item no debe aparecer en navegación.
- Si navega manualmente por URL a un módulo no permitido, debe redirigirse a un módulo permitido.
- Si no tiene ningún módulo operativo permitido, debe ver un estado vacío explícito.

### 6.4 Acciones y formularios

Los formularios deben validar permisos antes de abrir y antes de enviar.

Archivos actuales a refactorizar:

- `src/features/inventory/page.tsx`
- `src/features/inventory/columns.tsx`
- `src/features/inventory/components/mobile-action-drawer.tsx`
- `src/components/modals/in-modal/index.tsx`
- `src/components/modals/out-modal/index.tsx`
- `src/components/modals/return-modal/index.tsx`
- `src/components/modals/return-modal/components/return-summary-footer.tsx`
- `src/features/cash-closes/page.tsx`
- `src/features/settings/components/exchange-rate-section.tsx`

## 7. Arquitectura backend objetivo

### 7.1 Mantener autorización real en Supabase

El frontend solo mejora UX. La seguridad real debe seguir en:

- RLS.
- RPCs.
- Funciones privadas.
- Grants explícitos.

Archivo base:

- `supabase/migrations/20260622153214_migrate_to_multi_business.sql`

Las nuevas reglas deben ir en una migración nueva creada con Supabase CLI, no editando migraciones ya aplicadas.

### 7.2 Usuarios activos/inactivos

Agregar soporte para desactivación operativa.

Cambios propuestos:

- Agregar `public.users.is_active boolean not null default true`.
- Agregar función privada `private.is_active_user()`.
- Hacer que `private.has_operational_role()` exija usuario activo.
- Hacer que funciones administrativas impidan que un admin se desactive a sí mismo si es el último admin activo.

Nota de seguridad:

- Si solo se actualiza `public.users.is_active`, el usuario podría conservar una sesión válida, pero RLS/RPC debe
  bloquear sus operaciones.
- Si se requiere desactivar también el acceso Auth, usar Edge Function o backend seguro con Supabase Auth Admin API.

### 7.3 Gestión segura de creación de usuarios

La SPA no puede usar `service_role`.

Opciones aceptables:

1. Edge Function `admin-create-user`:
   - Recibe email, nombre, rol, negocios asignados y negocio predeterminado.
   - Valida que el actor sea admin.
   - Usa Supabase Auth Admin API desde servidor.
   - Inserta o actualiza perfil público.
   - Configura accesos de negocio.

2. Flujo de invitación:
   - Admin crea invitación desde contexto seguro.
   - Usuario completa contraseña.
   - Trigger `private.handle_new_user()` crea perfil base.
   - Admin ajusta rol y negocios.

No aceptable:

- Crear usuarios con `service_role` desde el navegador.
- Confiar en `user_metadata` para autorización.

### 7.4 Acceso múltiple a negocios

La tabla `public.user_business_access` ya representa una relación muchos-a-muchos. El problema actual está en la RPC
`private.assign_user_business`, que borra accesos anteriores e inserta uno solo.

Cambios propuestos:

- Reemplazar o complementar `assign_user_business(uuid, uuid)` con:
  - `admin_set_user_business_access(p_user_id uuid, p_business_ids uuid[], p_default_business_id uuid)`
  - `admin_add_user_business(p_user_id uuid, p_business_id uuid)`
  - `admin_remove_user_business(p_user_id uuid, p_business_id uuid)`
- Exigir que `p_default_business_id` esté dentro de `p_business_ids`, salvo para admins.
- Permitir que employees tengan más de un negocio asignado.
- El `BusinessSwitcher` debe permitir cambio a cualquier usuario con más de un negocio accesible y permiso
  `business.switchAccessible`.

### 7.5 Permisos backend por rol

Fase inicial:

- Mantener condiciones SQL explícitas para `admin` y `employee`.
- Actualizar funciones privadas cuando se agregue un tercer rol.

Fase avanzada recomendada:

- Crear catálogo backend de permisos si el número de roles crece:
  - `public.permissions`
  - `public.role_permissions`
- Crear función `private.has_permission(p_permission text)`.
- Usar `private.has_permission(...)` dentro de RPCs sensibles.

Esta fase avanzada no es obligatoria si los roles siguen siendo pocos y fijos.

## 8. Plan de implementación por fases

### Fase 0 — Auditoría y contrato final

Objetivo: congelar el comportamiento esperado antes de tocar código.

Tareas:

- Confirmar nombre y alcance del tercer rol cuando exista.
- Confirmar si employees con varios negocios pueden cambiar entre ellos desde el switcher. Recomendación: sí.
- Confirmar si la desactivación debe bloquear solo operaciones o también login.
- Confirmar si creación de usuarios será por contraseña temporal o invitación.
- Revisar los permisos de la matriz de este documento.

Archivos de referencia:

- `src/features/auth/store/useAuthStore.ts`
- `src/types/supabase.ts`
- `src/types/index.ts`
- `supabase/migrations/20260622153214_migrate_to_multi_business.sql`

Criterio de salida:

- Matriz de permisos aprobada.
- Flujo de creación/desactivación definido.

### Fase 1 — Crear capa RBAC frontend

Objetivo: crear la API central de permisos sin alterar todavía todos los módulos.

Archivos nuevos:

- `src/features/auth/permissions/permissions.ts`
- `src/features/auth/permissions/role-permissions.ts`
- `src/features/auth/permissions/useCan.ts`
- `src/features/auth/permissions/PermissionGate.tsx`
- `src/features/auth/permissions/assertPermission.ts`
- `src/features/auth/permissions/index.ts`

Tests nuevos:

- `src/features/auth/permissions/role-permissions.test.ts`
- `src/features/auth/permissions/useCan.test.tsx`

Criterios:

- Admin recibe todos los permisos definidos para admin.
- Employee recibe permisos operativos, incluyendo:
  - `exchangeRates.update`
  - `exchangeRates.history.view`
- Rol desconocido recibe cero permisos funcionales.
- Ningún permiso depende de nombres de componentes.

### Fase 2 — Reemplazar checks directos por permisos

Objetivo: eliminar decisiones funcionales por rol fuera de la capa RBAC.

Refactors:

| Archivo | Cambio |
| --- | --- |
| `src/features/business/hooks/useBusinessSwitcher.ts` | Reemplazar `isAdmin` por `can("business.switchAccessible")` y número de negocios accesibles. |
| `src/features/inventory/page.tsx` | Reemplazar `isAdmin` por permisos `inventory.product.edit` y `inventory.product.toggleStatus`. |
| `src/features/inventory/columns.tsx` | Reemplazar `isAdmin` por callbacks/permisos semánticos. |
| `src/components/modals/return-modal/components/return-summary-footer.tsx` | Reemplazar `isEmployee` por permisos de refund y saldo a favor. |
| `src/features/settings/page.tsx` | Reemplazar `user.role === "admin"` por `can("users.manage")`. |
| `src/features/settings/hooks/useUserBusinessAccess.ts` | No filtrar solo `employee`; preparar para usuarios gestionables según permisos/reglas del módulo. |

Criterios:

- Buscar `role ===`, `role !==`, `isAdmin` e `isEmployee` no debe encontrar autorización funcional fuera de RBAC.
- Se permite mostrar el rol como texto en UI.

### Fase 3 — Proteger navegación, modales y acciones rápidas

Objetivo: que la UI no ofrezca acciones que el usuario no puede ejecutar.

Archivos:

- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/bottom-bar.tsx`
- `src/components/layout/mobile-menu-sheet.tsx`
- `src/components/layout/mobile-quick-actions-drawer.tsx`
- `src/components/modals/store/useModalStore.ts`
- `src/routes/_app.tsx`
- `src/routes/_app/inventory.tsx`
- `src/routes/_app/movements.tsx`
- `src/routes/_app/transactions.tsx`
- `src/routes/_app/returns.tsx`
- `src/routes/_app/cash-closes.tsx`
- `src/routes/_app/settings.tsx`

Tareas:

- Asociar cada item de navegación a un permiso.
- Ocultar módulos no permitidos.
- Bloquear apertura de modales si falta permiso.
- Redirigir rutas no permitidas al primer módulo permitido.
- Mostrar estado vacío si el usuario no tiene ningún módulo disponible.

Criterios:

- Un employee no ve gestión de usuarios.
- Un employee sí ve tasa de cambio y puede actualizarla.
- Un employee con dos negocios asignados puede cambiar entre ellos.
- Un usuario sin negocio activo no puede abrir modales operativos.

### Fase 4 — Crear módulo de gestión de usuarios

Objetivo: centralizar administración de usuarios en un módulo exclusivo para admin.

Archivos nuevos propuestos:

- `src/features/users/page.tsx`
- `src/features/users/hooks/useUserQueries.ts`
- `src/features/users/hooks/useUserMutations.ts`
- `src/features/users/components/user-create-modal.tsx`
- `src/features/users/components/user-status-modal.tsx`
- `src/features/users/components/user-business-access-editor.tsx`
- `src/features/users/components/user-default-business-select.tsx`
- `src/features/users/columns.tsx`
- `src/features/users/schemas.ts`
- `src/routes/_app/users.tsx`

Servicios:

- Refactorizar `src/services/usersService.ts`

Funcionalidades:

- Ver usuarios registrados.
- Crear usuario.
- Desactivar/reactivar usuario.
- Asignar una o varias tiendas.
- Definir tienda predeterminada.
- Mostrar rol, email, estado y negocios asignados.

Reglas:

- Solo admin puede acceder.
- Un admin no debe poder dejar a un employee sin tienda si el employee está activo.
- Si un usuario tiene tiendas asignadas, su `default_business_id` debe pertenecer a esa lista.
- Si un usuario pierde acceso al negocio actualmente seleccionado, debe sincronizarse al fallback permitido.

Criterios:

- Toda mutación invalida query keys de usuarios y negocios afectados.
- No se usa estado local como fuente de verdad de usuarios.
- El módulo funciona con TanStack Query.

### Fase 5 — Migración backend para usuarios y accesos

Objetivo: soportar gestión de usuarios, desactivación y acceso multi-negocio.

Crear una nueva migración con Supabase CLI.

Archivos afectados:

- `supabase/migrations/[timestamp]_rbac_user_management.sql`
- `supabase/seed.sql`
- `supabase/tests/multi_business_isolation.test.sql`
- Nuevos tests SQL en `supabase/tests/`

Cambios mínimos propuestos:

- `public.users.is_active boolean not null default true`.
- Función `private.is_active_user()`.
- Actualizar `private.has_operational_role()`.
- RPC admin para configurar múltiples negocios:
  - `public.admin_set_user_business_access(...)`
- RPC admin para desactivar/reactivar:
  - `public.admin_set_user_active(...)`
- Revisar `users_select` para que:
  - admin pueda ver usuarios gestionables;
  - usuarios operativos puedan leer lo necesario para relaciones existentes;
  - roles futuros no reciban acceso accidental.

Cambios opcionales según decisión de producto:

- Edge Function para creación de usuarios:
  - `supabase/functions/admin-create-user/index.ts`
- Edge Function para desactivar también en Supabase Auth:
  - `supabase/functions/admin-set-user-auth-status/index.ts`

Criterios:

- Un usuario inactivo no puede leer ni escribir datos operativos.
- Un employee con dos negocios asignados ve exactamente esos dos negocios.
- `default_business_id` inválido es rechazado.
- Solo admin puede cambiar accesos de otros usuarios.

### Fase 6 — Sincronizar tipos, queries y seed

Objetivo: alinear TypeScript, seed y frontend con la migración.

Archivos:

- `src/types/supabase.ts`
- `src/types/index.ts`
- `src/features/business/store/useBusinessStore.ts`
- `src/features/business/hooks/useBusinessQueries.ts`
- `src/services/businessesService.ts`
- `src/services/usersService.ts`
- `supabase/seed.sql`

Tareas:

- Regenerar tipos de Supabase.
- Actualizar `UserWithBusinessAccess` para múltiples negocios.
- Reemplazar `business_id` único por `business_ids` o `businesses`.
- Mantener `default_business_id`.
- Añadir usuarios seed para:
  - admin;
  - employee con un negocio;
  - employee con dos negocios;
  - usuario inactivo.

Criterios:

- `npm run build` no debe reportar tipos obsoletos.
- `npx supabase reset` debe poblar escenarios suficientes para probar RBAC.

### Fase 7 — Tests frontend y SQL

Objetivo: comprobar permisos, UI y backend.

Tests frontend:

- `src/features/auth/permissions/*.test.ts`
- `src/features/business/store/useBusinessStore.test.ts`
- `src/features/business/hooks/useBusinessSwitcher.test.tsx`
- `src/features/users/hooks/useUserQueries.test.tsx`
- `src/features/users/hooks/useUserMutations.test.tsx`
- Tests de componentes críticos de navegación y modales.

Tests SQL:

- `supabase/tests/rbac_permissions.test.sql`
- `supabase/tests/user_business_access.test.sql`
- `supabase/tests/inactive_users.test.sql`
- Mantener y ampliar `supabase/tests/multi_business_isolation.test.sql`

Comandos:

```bash
npm run lint
npm run test:run
npm run test:db
npm run build
```

Criterios:

- Todos los permisos definidos tienen tests.
- Toda RPC admin tiene tests positivos y negativos.
- El rol futuro, si aún no está definido, no recibe permisos por accidente.

### Fase 8 — Rollout local y preparación de producción

Objetivo: validar de punta a punta antes de producción.

Flujo local:

```bash
npm run supabase:start
npx supabase reset
npm run test:all
npm run build
npm run dev
```

Validaciones manuales:

- Admin puede entrar a gestión de usuarios.
- Admin puede crear/desactivar usuario.
- Admin puede asignar una o varias tiendas.
- Admin puede definir fallback.
- Employee con una tienda no ve switcher operativo.
- Employee con dos tiendas puede alternar entre ellas.
- Employee puede actualizar tasa y ver historial.
- Employee no puede editar ni desactivar producto.
- Employee no puede procesar refund ni cambio con saldo a favor.
- Usuario inactivo queda bloqueado.

Producción:

- No tocar producción hasta que la migración, seed local y tests pasen.
- Preparar ventana de despliegue sin empleados usando el sistema.
- Ejecutar migración backend antes de habilitar UI que dependa de nuevas columnas/RPCs.
- Forzar recarga de clientes si la versión anterior de la SPA puede quedar abierta.

## 9. Contratos propuestos

### 9.1 Permission type

```ts
export type Permission =
  | "app.access"
  | "business.viewAssigned"
  | "business.switchAccessible"
  | "inventory.view"
  | "inventory.product.create"
  | "inventory.stock.add"
  | "inventory.product.edit"
  | "inventory.product.toggleStatus"
  | "inventory.movements.view"
  | "sales.view"
  | "sales.create"
  | "returns.view"
  | "returns.exchange.create"
  | "returns.refund.create"
  | "returns.favorableBalance.create"
  | "cashCloses.view"
  | "cashCloses.generate"
  | "exchangeRates.view"
  | "exchangeRates.history.view"
  | "exchangeRates.update"
  | "settings.view"
  | "users.view"
  | "users.create"
  | "users.deactivate"
  | "users.assignBusinesses"
  | "users.setDefaultBusiness"
  | "users.manage";
```

### 9.2 User management DTO

```ts
export type ManagedUser = {
  id: string;
  email: string;
  fullname: string;
  role: UserRole;
  is_active: boolean;
  default_business_id: string | null;
  business_ids: string[];
  created_at: string;
  updated_at: string | null;
};
```

### 9.3 Business assignment payload

```ts
export type SetUserBusinessAccessPayload = {
  userId: string;
  businessIds: string[];
  defaultBusinessId: string | null;
};
```

Regla:

- Si `businessIds.length > 0`, `defaultBusinessId` debe estar incluido en `businessIds`.

## 10. Criterios de aceptación globales

- **AC-001**: No existen checks funcionales por rol fuera de `src/features/auth/permissions/`.
- **AC-002**: La navegación se construye desde permisos.
- **AC-003**: Las acciones críticas validan permisos antes de abrirse y antes de ejecutar mutación.
- **AC-004**: Employee puede actualizar tasa de cambio y ver historial.
- **AC-005**: Employee no puede editar, desactivar ni reactivar productos.
- **AC-006**: Employee no puede procesar refunds ni saldos a favor.
- **AC-007**: Admin puede gestionar usuarios.
- **AC-008**: Admin puede asignar múltiples negocios a un usuario.
- **AC-009**: El fallback de negocio siempre apunta a un negocio accesible.
- **AC-010**: Usuario inactivo no puede operar aunque tenga sesión local.
- **AC-011**: Supabase bloquea operaciones no permitidas aunque el frontend sea manipulado.
- **AC-012**: `npm run lint`, `npm run test:run`, `npm run test:db` y `npm run build` pasan.

## 11. Referencias de archivos

### Frontend actual

- `src/features/auth/store/useAuthStore.ts`
- `src/routes/_app.tsx`
- `src/components/layout/app-layout.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/bottom-bar.tsx`
- `src/components/layout/mobile-menu-sheet.tsx`
- `src/components/layout/mobile-quick-actions-drawer.tsx`
- `src/features/business/hooks/useBusinessQueries.ts`
- `src/features/business/hooks/useBusinessSwitcher.ts`
- `src/features/business/store/useBusinessStore.ts`
- `src/features/inventory/page.tsx`
- `src/features/inventory/columns.tsx`
- `src/components/modals/return-modal/components/return-summary-footer.tsx`
- `src/features/settings/page.tsx`
- `src/features/settings/hooks/useUserBusinessAccess.ts`
- `src/features/settings/components/user-business-access-section.tsx`
- `src/features/settings/components/exchange-rate-section.tsx`
- `src/features/cash-closes/page.tsx`
- `src/services/usersService.ts`
- `src/services/businessesService.ts`
- `src/types/index.ts`
- `src/types/supabase.ts`

### Backend y datos

- `supabase/migrations/20260610123117_remote_schema.sql`
- `supabase/migrations/20260622153214_migrate_to_multi_business.sql`
- `supabase/seed.sql`
- `supabase/tests/multi_business_isolation.test.sql`

### Especificaciones relacionadas

- `spec/spec-architecture-migracion-multi-negocio.md`
- `spec/spec-process-deuda-tecnica-post-migracion.md`
