---
title: Arquitectura y plan de migración multi-negocio
version: 1.1
date_created: 2026-06-22
last_updated: 2026-06-22
owner: Anderson R. Román
tags:
  - architecture
  - migration
  - supabase
  - postgresql
  - multi-tenancy
  - security
---

# Introducción

Esta especificación define la extensión multi-negocio de la plataforma Full Calzado. El objetivo es incorporar
Zapatería Estilos C.A. sin duplicar la aplicación ni la infraestructura, manteniendo separación de datos por
negocio en PostgreSQL mediante Row-Level Security (RLS).

El documento se basa en:

- El esquema de producción suministrado en
  `supabase/migrations/20260610123117_remote_schema.sql`, generado el 2026-06-10.
- El código actual de la SPA React y su capa de servicios Supabase.
- La cotización `Cotización de Desarrollo - 20260012.md`.

Este documento es una especificación de implementación. No es una migración SQL lista para ejecutar.

Los hallazgos que no bloquean el aislamiento multi-negocio se registran en
[`spec-process-deuda-tecnica-post-migracion.md`](spec-process-deuda-tecnica-post-migracion.md).

## 1. Propósito y alcance

### 1.1 Propósito

Definir una migración segura y verificable que permita:

- Administrar Full Calzado C.A. y Zapatería Estilos C.A. desde la misma SPA.
- Separar inventario, movimientos, ventas, devoluciones, tasas, ajustes y cierres por negocio.
- Permitir que el administrador cambie de negocio sin cerrar sesión.
- Restringir empleados a los negocios asignados.
- Preservar todo el historial actual como información de Full Calzado C.A.
- Evitar accesos cruzados incluso si un cliente llama directamente a la Data API o a una función RPC.

### 1.2 Dentro del alcance

- Cambios de esquema, restricciones, índices, RLS, privilegios, funciones y triggers.
- Migración de los datos existentes.
- Contexto de negocio activo en el frontend.
- Adaptación de servicios, queries, mutations, tipos, seed y pruebas.
- Asignación de acceso por usuario.
- Procedimiento de despliegue y validación.

### 1.3 Fuera del alcance

- Crear una aplicación o proyecto Supabase separado por negocio.
- Crear módulos funcionales nuevos no relacionados con multi-negocio.
- Rediseñar completamente los permisos funcionales de `admin` y `employee`.
- Corregir toda la deuda técnica histórica del sistema.
- Ejecutar la migración en producción desde este documento.

Los problemas de seguridad que puedan romper el aislamiento o permitir suplantación sí forman parte del alcance,
aunque ya existieran antes de la migración.

## 2. Definiciones

| Término          | Definición                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Negocio o tenant | Unidad propietaria de información. En esta fase: Full Calzado C.A. o Zapatería Estilos C.A.          |
| Negocio activo   | Negocio que la interfaz está mostrando y sobre el cual se ejecutan nuevas operaciones.               |
| RLS              | Row-Level Security de PostgreSQL. Limita filas visibles o modificables según el usuario autenticado. |
| Data API         | API REST de Supabase/PostgREST expuesta a la SPA.                                                    |
| RPC              | Función PostgreSQL invocada mediante `supabase.rpc(...)`.                                            |
| Backfill         | Asignación de `business_id` a filas históricas existentes.                                           |
| Frontera tenant  | Regla que impide leer o escribir datos de un negocio sin autorización.                               |
| Tabla global     | Tabla cuyo contenido no pertenece a un único negocio.                                                |
| Tabla tenant     | Tabla cuyas filas deben contener un `business_id`.                                                   |

## 3. Estado real confirmado

### 3.1 Tablas existentes en producción

El esquema suministrado contiene estas tablas:

| Tabla                        | Uso actual                                  | Clasificación objetivo |
| ---------------------------- | ------------------------------------------- | ---------------------- |
| `public.users`               | Perfil, rol y relación con `auth.users`     | Global                 |
| `public.products`            | Productos y existencia                      | Tenant                 |
| `public.inventory_movements` | Entradas, salidas, devoluciones y ediciones | Tenant                 |
| `public.transactions`        | Ventas                                      | Tenant                 |
| `public.returns`             | Cabecera de cambios y devoluciones          | Tenant                 |
| `public.return_items`        | Productos devueltos                         | Tenant                 |
| `public.cash_closes`         | Cierres diarios                             | Tenant                 |
| `public.exchange_rates`      | Historial de tasas                          | Tenant                 |
| `public.app_settings`        | Configuración de tasa                       | Tenant                 |

Las tablas `sales` y `history` mencionadas en el borrador anterior no existen. La venta se representa con
`transactions`; el historial está distribuido entre `transactions`, `inventory_movements`, `returns` y
`cash_closes`.

### 3.2 Funciones existentes que deben revisarse

| Función                                       | Tipo                        | Impacto multi-negocio                         |
| --------------------------------------------- | --------------------------- | --------------------------------------------- |
| `public.edit_product`                         | RPC, `SECURITY DEFINER`     | Edita producto y crea movimiento.             |
| `public.generate_daily_cash_close`            | RPC, `SECURITY DEFINER`     | Agrega ventas, devoluciones y tasa del día.   |
| `public.handle_new_user`                      | Trigger, `SECURITY DEFINER` | Crea el perfil de un usuario.                 |
| `public.log_product_entry`                    | Trigger, `SECURITY DEFINER` | Crea movimientos al aumentar stock.           |
| `public.prevent_movement_on_inactive_product` | Trigger                     | Consulta el producto relacionado.             |
| `public.process_return`                       | RPC, `SECURITY DEFINER`     | Crea devolución, ítems, ventas y movimientos. |
| `public.process_return_item`                  | Trigger, `SECURITY DEFINER` | Devuelve stock y crea movimiento.             |
| `public.process_sale_transaction`             | Trigger, `SECURITY DEFINER` | Descuenta stock y crea movimiento.            |
| `public.sync_stock_on_entry_movement`         | Trigger, `SECURITY DEFINER` | Aumenta stock por entradas.                   |

Todas deben conservar el mismo `business_id` a través de sus lecturas y escrituras relacionadas.

### 3.3 Restricciones globales incompatibles

Actualmente:

- `products.code` es único globalmente.
- `cash_closes.date` es único globalmente.
- `app_settings` solo permite `id = 1`.

Estas reglas impiden operar dos negocios independientes. El estado objetivo requiere:

- `UNIQUE (business_id, code)` en productos.
- `UNIQUE (business_id, date)` en cierres.
- Una fila de ajustes por negocio.

## 4. Hallazgos de auditoría

### 4.1 Hallazgos críticos

| ID      | Hallazgo                                                                                           | Riesgo                                                                                  | Resolución requerida                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| SEC-001 | Las RPC `SECURITY DEFINER` están concedidas a `anon`.                                              | Una llamada no autenticada puede ejecutar lógica privilegiada.                          | Revocar ejecución a `PUBLIC` y `anon`; conceder solo a los roles necesarios.                              |
| SEC-002 | Varias RPC y escrituras directas aceptan `user_id` o `updated_by` desde el cliente.                | Un usuario puede atribuir operaciones a otro usuario o aprovechar su rol.               | Las RPC usan `auth.uid()` y las escrituras directas exigen que el actor enviado sea igual a `auth.uid()`. |
| SEC-003 | Las funciones `SECURITY DEFINER` no fijan un `search_path` seguro.                                 | Resolución de objetos manipulable y comportamiento no determinista.                     | Usar `SET search_path = ''` y nombres completamente calificados.                                          |
| SEC-004 | La política y los grants actuales de `public.users` permiten acceso total a cualquier autenticado. | Un empleado puede modificar perfiles o roles, incluida una elevación a `admin`.         | Mantener lectura autenticada de perfiles, pero reservar toda escritura a operaciones administrativas.     |
| SEC-005 | Las políticas actuales de varias tablas usan `USING (true)`.                                       | Sin una frontera restrictiva, cualquier autenticado accede a todas las filas.           | Añadir primero una política tenant `RESTRICTIVE` y luego reemplazar políticas amplias.                    |
| SEC-006 | Los triggers privilegiados no verifican que las filas relacionadas pertenezcan al mismo negocio.   | Una fila podría referenciar un producto o devolución de otro tenant.                    | Añadir claves foráneas compuestas y validaciones en funciones.                                            |
| SEC-007 | La política “Evitar borrado de settings” convive con una política permisiva `USING (true)`.        | Las políticas se combinan con `OR`; la prohibición no protege realmente `app_settings`. | Reemplazar políticas contradictorias por políticas explícitas por operación.                              |

### 4.2 Hallazgos altos

| ID      | Hallazgo                                                                                | Consecuencia                                                                 |
| ------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| DAT-001 | El borrador omitía `returns`, `return_items` y `app_settings`.                          | Filtración o mezcla de devoluciones y configuración.                         |
| DAT-002 | El cierre diario agrega todas las ventas, devoluciones y tasas sin filtrar negocio.     | Cierres combinados y sobrescritura por fecha.                                |
| DAT-003 | Los triggers no propagan `business_id`.                                                 | Movimientos sin tenant o asignados incorrectamente.                          |
| DAT-004 | Las claves foráneas por `id` no comprueban coincidencia de tenant.                      | Relaciones cruzadas válidas para PostgreSQL pero inválidas para el dominio.  |
| DAT-005 | `log_product_entry` usa el primer usuario disponible cuando no existe `auth.uid()`.     | Auditoría falsa y no determinista.                                           |
| API-001 | Las consultas y query keys actuales no incluyen negocio.                                | Mezcla visual o reutilización de caché al cambiar de negocio.                |
| API-002 | El flujo de autenticación propuesto en el borrador no coincide con el bootstrap actual. | Duplicación de listeners y riesgo de bloqueos dentro de `onAuthStateChange`. |

### 4.3 Hallazgos medios

| ID      | Hallazgo                                                                            | Resolución                                                            |
| ------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| OPS-001 | El borrador no define una ventana de corte entre frontend y base de datos.          | Usar despliegue coordinado con pausa breve de escrituras.             |
| OPS-002 | Las tablas nuevas necesitan privilegios explícitos en Supabase desde el 2026-05-30. | Incluir `GRANT` explícitos en la migración.                           |
| TST-001 | Los tests propuestos usan columnas inexistentes como `sku` y `base_price`.          | Reescribir fixtures con `code`, `description`, `stock` y `price_usd`. |
| TST-002 | La ruta propuesta `supabase/tests/database/` no coincide con el repositorio.        | Mantener tests en `supabase/tests/`.                                  |
| TST-003 | Faltaban pruebas de devoluciones, triggers, funciones y relaciones cruzadas.        | Añadir matriz de aislamiento completa.                                |

## 5. Decisiones de arquitectura

### 5.1 Modelo de tenancy

Se utilizará multi-tenancy por columna:

- Una sola base de datos.
- Un solo esquema funcional.
- Una columna `business_id UUID NOT NULL` en cada tabla tenant.
- RLS como frontera de seguridad.
- Filtros explícitos por negocio en el frontend.

La selección del frontend no concede permisos. Solo define qué negocio autorizado se muestra.

### 5.2 Negocios iniciales

La migración creará:

1. Full Calzado C.A., slug `full-calzado`.
2. Zapatería Estilos C.A., slug `zapateria-estilos`.

Los UUID se declararán como constantes explícitas en la migración final. No se deben resolver por nombre visible ni
hardcodear en la SPA.

### 5.3 Clasificación de datos

Se añadirá `business_id` a:

- `products`
- `inventory_movements`
- `transactions`
- `returns`
- `return_items`
- `cash_closes`
- `exchange_rates`
- `app_settings`

`public.users` seguirá siendo global. Sus accesos se definirán en `user_business_access`.

### 5.4 Accesos y negocio predeterminado

Se crearán:

- `public.businesses`
- `public.user_business_access`
- `public.users.default_business_id`

Reglas:

- El administrador puede acceder a todos los negocios.
- Un empleado solo puede acceder a negocios asignados.
- Para el alcance actual, cada empleado debe terminar con exactamente un negocio asignado.
- `user_business_access.user_id` es clave primaria y hace cumplir una sola asignación por empleado.
- Permitir múltiples asignaciones en el futuro requerirá una migración explícita de esa restricción.
- La autorización operativa debe comprobar roles permitidos de forma explícita: `admin` y `employee`.
- Un rol futuro no recibe permisos por ser simplemente `authenticated`; inicia con denegación por defecto.
- Full Calzado será el negocio predeterminado del administrador en un inicio de sesión nuevo.
- La asignación y el negocio predeterminado se actualizan en una única operación transaccional.
- Un usuario nuevo sin asignación no puede entrar a módulos operativos.
- Desactivar un negocio no elimina su historial.

### 5.5 Tasas y ajustes

Las tasas de cambio y sus ajustes serán independientes por negocio.

Razón: la cotización exige gestión completamente independiente. Mantener una tasa global produciría una dependencia
operativa no declarada entre ambas tiendas.

Durante el backfill:

- Todo el historial actual de tasas se asigna a Full Calzado.
- Zapatería Estilos recibe una tasa inicial explícita antes de habilitar operaciones.
- `app_settings` deja de ser singleton global y pasa a tener una fila por negocio.

En el código actual, la tasa visible en el frontend se obtiene de `exchange_rates`. `app_settings` representa el
modo de actualización (`manual` o `bcv`) y se conserva como configuración por negocio, aunque actualmente la SPA
no consulta esa tabla directamente.

### 5.6 Códigos de producto

El código será único dentro de un negocio, no en toda la plataforma. Dos negocios podrán usar el mismo código sin
compartir stock ni historial.

## 6. Requisitos, restricciones y guías

### 6.1 Requisitos funcionales

- **REQ-001**: Toda fila tenant debe tener un `business_id` no nulo.
- **REQ-002**: Los datos históricos existentes deben pertenecer a Full Calzado.
- **REQ-003**: El administrador debe poder cambiar entre negocios sin cerrar sesión.
- **REQ-004**: Un empleado no debe poder seleccionar ni consultar un negocio no asignado.
- **REQ-005**: Cambiar el negocio activo debe recargar los datos de todos los módulos.
- **REQ-006**: Producto, venta, devolución, movimiento, tasa y cierre deben conservar el mismo tenant en toda la
  operación.
- **REQ-007**: Debe existir como máximo un cierre por negocio y fecha.
- **REQ-008**: Debe existir como máximo un código de producto por negocio.
- **REQ-009**: La asignación de accesos debe ser atómica.
- **REQ-010**: Los negocios con historial se desactivan; no se eliminan.
- **REQ-011**: Los roles `admin` y `employee` pueden crear productos, agregar stock, registrar ventas, actualizar
  la tasa y generar cierres en negocios autorizados.
- **REQ-012**: Solo `admin` puede editar o desactivar productos.
- **REQ-013**: Ningún rol de aplicación elimina productos ni registros históricos.
- **REQ-014**: Todo rol añadido en el futuro debe comenzar sin permisos operativos hasta ser incluido
  explícitamente en las políticas correspondientes.

### 6.2 Requisitos de seguridad

- **SEC-101**: RLS debe estar habilitado en todas las tablas expuestas del esquema `public`.
- **SEC-102**: La frontera tenant debe aplicarse a `SELECT`, `INSERT`, `UPDATE` y `DELETE`.
- **SEC-103**: Las políticas nuevas deben usar `TO authenticated`.
- **SEC-104**: `anon` no debe tener acceso a tablas operativas ni ejecutar RPC de negocio.
- **SEC-105**: Las funciones no deben usar `raw_user_meta_data` para autorización.
- **SEC-106**: El rol se obtiene de `public.users`, no del cliente.
- **SEC-107**: Las RPC resuelven el actor con `auth.uid()`. Las escrituras directas que incluyen `user_id`,
  `updated_by` o `closed_by` deben exigir igualdad con `(SELECT auth.uid())` mediante `WITH CHECK`.
- **SEC-108**: Ninguna función privilegiada debe confiar en `business_id`, `user_id` o rol sin validarlos.
- **SEC-109**: Las funciones `SECURITY DEFINER` deben vivir en un esquema privado cuando no necesiten exposición
  directa.
- **SEC-110**: Toda función privilegiada debe usar `SET search_path = ''` y objetos calificados.
- **SEC-111**: Las funciones deben revocar el privilegio de ejecución predeterminado a `PUBLIC`.
- **SEC-112**: La aplicación nunca debe contener una clave `service_role` o secret key.
- **SEC-113**: Un negocio inactivo conserva lectura administrativa, pero no acepta operaciones nuevas.
- **SEC-114**: Las políticas operativas deben comprobar explícitamente que el rol sea `admin` o `employee`.
- **SEC-115**: Se deben revocar los privilegios predeterminados de tablas, secuencias y funciones; cada objeto
  nuevo recibe grants explícitos.

### 6.3 Restricciones

- **CON-001**: `20260610123117_remote_schema.sql` es una línea base; no se editará.
- **CON-002**: Los cambios se implementarán en una migración nueva creada con Supabase CLI.
- **CON-003**: La base local usa PostgreSQL 17 según `supabase/config.toml`.
- **CON-004**: El frontend actual usa React, Zustand y TanStack Query.
- **CON-005**: Los tipos de `src/types/supabase.ts` se regeneran; no se mantienen manualmente.
- **CON-006**: No se puede declarar completo el despliegue sin pruebas de aislamiento.
- **CON-007**: Una restauración desde backup es el rollback confiable después de registrar datos en el segundo
  negocio.

## 7. Modelo de datos objetivo

### 7.1 `businesses`

Campos mínimos:

| Campo        | Regla                                   |
| ------------ | --------------------------------------- |
| `id`         | UUID, PK                                |
| `name`       | Texto no nulo                           |
| `slug`       | Texto no nulo, único e inmutable        |
| `is_active`  | Booleano no nulo, predeterminado `true` |
| `created_at` | `timestamptz` no nulo                   |
| `updated_at` | `timestamptz` no nulo                   |

No se permitirá borrado desde la aplicación.

### 7.2 `user_business_access`

Campos mínimos:

| Campo         | Regla                                        |
| ------------- | -------------------------------------------- |
| `user_id`     | FK a `public.users(id)`, `ON DELETE CASCADE` |
| `business_id` | FK a `businesses(id)`, `ON DELETE RESTRICT`  |
| `created_at`  | `timestamptz` no nulo                        |

Restricciones e índices:

- PK `user_id`, que limita cada usuario a una sola asignación.
- Índice en `(business_id, user_id)` para administración.

No se necesita un índice separado en `user_id`: la PK ya cubre esa columna.

### 7.3 `users.default_business_id`

- FK a `businesses(id)`, `ON DELETE RESTRICT`.
- Nullable mientras un usuario nuevo espera asignación.
- No constituye autorización.
- Para empleados debe coincidir con una fila de `user_business_access`.
- Para el administrador inicial debe apuntar a Full Calzado.

La coherencia se aplicará dentro de la RPC administrativa; no dependerá del formulario.

### 7.4 Integridad entre tablas tenant

Cada relación tenant debe comprobar negocio e identificador.

Ejemplos conceptuales:

- `(business_id, product_id)` referencia `products(business_id, id)`.
- `(business_id, return_id)` referencia `returns(business_id, id)`.

Esto aplica a:

| Tabla hija            | Relación                       |
| --------------------- | ------------------------------ |
| `transactions`        | Producto y devolución opcional |
| `inventory_movements` | Producto y devolución opcional |
| `return_items`        | Producto y devolución          |

Para soportar estas claves foráneas, `products` y `returns` necesitan una restricción única auxiliar sobre
`(business_id, id)`, aunque `id` ya sea PK global.

### 7.5 Cambios de restricciones

| Tabla          | Restricción actual        | Restricción objetivo                                    |
| -------------- | ------------------------- | ------------------------------------------------------- |
| `products`     | `UNIQUE (code)`           | `UNIQUE (business_id, code)`                            |
| `cash_closes`  | `UNIQUE (date)`           | `UNIQUE (business_id, date)`                            |
| `app_settings` | PK `id`, `CHECK (id = 1)` | Una fila por negocio; `business_id` como PK recomendado |

El `id` numérico de `app_settings` no es usado por el frontend actual. La migración recomendada conserva la fila,
elimina el modelo singleton y usa `business_id` como identidad.

### 7.6 Índices mínimos

Los índices se diseñarán según las consultas actuales:

| Tabla                  | Índice recomendado                          |
| ---------------------- | ------------------------------------------- |
| `products`             | `(business_id, created_at DESC)`            |
| `products`             | `(business_id, active)`                     |
| `transactions`         | `(business_id, date DESC, created_at DESC)` |
| `inventory_movements`  | `(business_id, created_at DESC)`            |
| `returns`              | `(business_id, date DESC, created_at DESC)` |
| `cash_closes`          | Único `(business_id, date)`                 |
| `exchange_rates`       | `(business_id, updated_at DESC)`            |
| `return_items`         | `(business_id, return_id)`                  |
| `user_business_access` | `(business_id, user_id)`                    |

No se crearán índices duplicados sin revisar primero los existentes.

## 8. Diseño de RLS y privilegios

### 8.1 Helpers privados

Se creará un esquema no expuesto, por ejemplo `private`, con helpers:

- `private.is_admin()`
- `private.has_operational_role()`
- `private.has_business_access(p_business_id uuid)`
- `private.can_write_business(p_business_id uuid)`

Propiedades:

- `SECURITY DEFINER`.
- `STABLE` cuando corresponda.
- `SET search_path = ''`.
- Uso de `(SELECT auth.uid())`.
- Acceso mínimo a tablas.
- Sin parámetros de usuario controlados por el navegador.

`has_business_access` permitirá:

- Todos los negocios para administradores.
- Solo asignaciones existentes para empleados.

`has_operational_role` devolverá verdadero únicamente para los roles `admin` y `employee`. No se implementará como
“rol distinto de X”, porque eso concedería permisos accidentalmente a futuros roles.

`can_write_business` exigirá simultáneamente:

- Rol operativo explícito.
- Acceso al negocio.
- `businesses.is_active = true`.

### 8.2 Estrategia de políticas

La migración se hará en dos pasos:

1. Crear una política tenant `RESTRICTIVE` en cada tabla existente para cerrar inmediatamente el hueco de las
   políticas amplias actuales.
2. Sustituir las políticas `USING (true)` por políticas explícitas por operación.

El estado final no debe depender de políticas permisivas genéricas.

Cada tabla tenant debe tener:

- Al menos una política `PERMISSIVE` que conceda la operación al rol funcional correspondiente.
- Una política tenant `RESTRICTIVE` que exija acceso al `business_id`.
- `USING` para controlar filas existentes.
- `WITH CHECK` para controlar filas nuevas o modificadas.
- Una política `SELECT` compatible cuando exista `UPDATE`, `DELETE`, `RETURNING` u `ON CONFLICT`.

### 8.3 Matriz de acceso por operación

La siguiente matriz es obligatoria. “Interno” significa que la operación solo puede ocurrir desde una función o
trigger protegido, no mediante Data API directa.

| Recurso                | `admin`                                                        | `employee`                                    | Rol futuro                 | Reglas adicionales                                                              |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `businesses`           | `SELECT` todos; activar/desactivar mediante RPC administrativa | `SELECT` asignados y activos                  | Sin acceso                 | Sin `DELETE`                                                                    |
| `user_business_access` | `SELECT`; escritura mediante RPC administrativa                | `SELECT` filas propias                        | Sin acceso                 | Sin escritura directa                                                           |
| `users`                | `SELECT` todos; cambios administrativos mediante RPC           | `SELECT` todos                                | Sin acceso hasta definirlo | Email y rol pueden ser visibles; sin escritura directa                          |
| `products`             | `SELECT`, `INSERT`; edición y activación mediante RPC          | `SELECT`, `INSERT`                            | Sin acceso                 | Sin `UPDATE` directo ni `DELETE`                                                |
| `inventory_movements`  | `SELECT`; `INSERT` directo solo para `entry`                   | `SELECT`; `INSERT` directo solo para `entry`  | Sin acceso                 | `user_id = auth.uid()`; `edit`, `exit` y `return` son internos                  |
| `transactions`         | `SELECT`, `INSERT`                                             | `SELECT`, `INSERT`                            | Sin acceso                 | `user_id = auth.uid()`; sin `UPDATE` ni `DELETE`                                |
| `returns`              | `SELECT`; escritura mediante `process_return`                  | `SELECT`; escritura mediante `process_return` | Sin acceso                 | Se conservan las restricciones actuales para reembolsos y diferencias negativas |
| `return_items`         | `SELECT`; escritura interna                                    | `SELECT`; escritura interna                   | Sin acceso                 | Sin escritura directa                                                           |
| `cash_closes`          | `SELECT`; escritura mediante RPC                               | `SELECT`; escritura mediante RPC              | Sin acceso                 | Ambos roles actuales pueden generar el cierre                                   |
| `exchange_rates`       | `SELECT`, `INSERT`                                             | `SELECT`, `INSERT`                            | Sin acceso                 | Historial append-only; `updated_by = auth.uid()`                                |
| `app_settings`         | `SELECT`, `UPDATE`                                             | `SELECT`, `UPDATE`                            | Sin acceso                 | Solo negocio autorizado; `updated_by = auth.uid()`                              |

Las escrituras están además condicionadas a `can_write_business(business_id)`. El administrador puede leer
historial de negocios inactivos, pero ningún rol puede crear operaciones nuevas en ellos.

### 8.4 Privilegios SQL

La migración debe:

- Revocar acceso de `anon` a tablas operativas.
- Revocar ejecución de funciones a `PUBLIC` y `anon`.
- Conceder a `authenticated` solo operaciones requeridas.
- Conceder explícitamente acceso a `businesses` y `user_business_access`.
- Conceder `USAGE` y `EXECUTE` mínimos sobre el esquema privado sin exponerlo en la Data API.
- No depender de privilegios automáticos para tablas nuevas.
- Mantener `service_role` exclusivamente para procesos confiables del servidor.
- Revocar privilegios predeterminados sobre tablas, secuencias y funciones para `PUBLIC`, `anon`,
  `authenticated` y `service_role`, reotorgando explícitamente únicamente los permisos necesarios.

Las RPC expuestas deben ser wrappers `SECURITY INVOKER` en `public`. La implementación privilegiada y los
triggers deben residir en el esquema privado con `SECURITY DEFINER`. Esto mantiene el código privilegiado fuera
del esquema expuesto y centraliza las validaciones obligatorias.

## 9. Contratos de funciones y triggers

### 9.1 Reglas comunes

Toda función o trigger que toque datos tenant debe:

1. Resolver al actor con `auth.uid()`.
2. Rechazar actor nulo en llamadas de aplicación.
3. Resolver o recibir el negocio activo.
4. Validar acceso antes de leer o modificar.
5. Validar que todas las entidades relacionadas pertenezcan al mismo negocio.
6. Propagar `business_id` a cada fila creada.
7. No usar `SELECT ... FROM users LIMIT 1` como fallback.

### 9.2 Mutaciones administrativas de productos

`edit_product` debe:

- Recibir `p_business_id` y los campos editables.
- No recibir un `p_user_id` confiable.
- Buscar el producto por `(business_id, id)`.
- Validar que el actor sea `admin` y tenga acceso de escritura al negocio.
- Crear el movimiento `edit` con el mismo `business_id`.
- Rechazar cambios de código que violen la unicidad dentro del negocio.

La activación o desactivación debe ejecutarse mediante otra RPC administrativa que:

- Reciba `p_business_id`, `p_product_id` y el nuevo estado.
- Exija rol `admin`.
- Busque el producto por `(business_id, id)`.
- No permita trasladar el producto a otro negocio.

No se concederá `UPDATE` directo sobre `products` al rol `authenticated`. Las firmas antiguas deben eliminarse para
que no queden endpoints inseguros disponibles.

### 9.3 `generate_daily_cash_close`

Contrato objetivo:

- Recibe `p_business_id`.
- Usa `auth.uid()` como `closed_by`.
- Permite ejecución únicamente a `admin` y `employee`.
- Filtra `transactions`, `returns` y `exchange_rates` por negocio.
- Usa conflicto `(business_id, date)`.
- Rechaza negocio inactivo o no autorizado.
- Rechaza una tasa inexistente o no positiva en vez de guardar un cierre con tasa cero.
- Devuelve únicamente el cierre generado para ese negocio.

### 9.4 `process_return`

Contrato objetivo:

- Recibe `p_business_id`.
- Usa `auth.uid()` como usuario.
- Permite ejecución únicamente a `admin` y `employee`.
- Conserva las reglas actuales de rol para reembolsos y diferencias negativas.
- Valida que cada producto devuelto o entregado pertenezca al negocio.
- Crea `returns`, `return_items`, `transactions` y `inventory_movements` con el mismo tenant.
- Rechaza arrays vacíos, cantidades no positivas y referencias duplicadas inválidas.

La validación financiera de precios enviados por el cliente se registra como deuda técnica separada porque no
forma parte del aislamiento multi-negocio.

### 9.5 Triggers de stock

`process_sale_transaction`, `process_return_item`, `sync_stock_on_entry_movement`,
`prevent_movement_on_inactive_product` y `log_product_entry` deben:

- Comparar `NEW.business_id` con el producto relacionado.
- Propagar ese valor a movimientos.
- Rechazar producto inexistente, inactivo cuando aplique o perteneciente a otro negocio.
- Mantener las protecciones anti-recursión actuales.

### 9.6 `handle_new_user`

- Crea el perfil global.
- No obtiene rol ni negocio desde `raw_user_meta_data`.
- Asigna rol `employee` por defecto.
- Deja `default_business_id` nulo hasta que un administrador complete la asignación.
- Mantiene el uso de `raw_user_meta_data` solo para el nombre visible.

### 9.7 Asignación administrativa

Se implementará una RPC transaccional para:

- Verificar que el actor sea administrador.
- Verificar que el usuario objetivo exista.
- Verificar que todos los negocios existan y estén activos.
- Eliminar asignaciones anteriores.
- Insertar asignaciones nuevas sin duplicados.
- Actualizar `default_business_id`.
- Rechazar un default fuera de la lista.
- Rechazar cero asignaciones para empleados activos.
- Requerir exactamente una asignación para empleados en el alcance actual.

No se implementará como `DELETE` e `INSERT` en dos solicitudes HTTP.

### 9.8 Identidad en escrituras directas

Las operaciones que se mantienen como inserts o updates directos deben aplicar estas condiciones:

| Tabla                 | Condición de identidad                          |
| --------------------- | ----------------------------------------------- |
| `inventory_movements` | `WITH CHECK (user_id = (SELECT auth.uid()))`    |
| `transactions`        | `WITH CHECK (user_id = (SELECT auth.uid()))`    |
| `exchange_rates`      | `WITH CHECK (updated_by = (SELECT auth.uid()))` |
| `app_settings`        | `WITH CHECK (updated_by = (SELECT auth.uid()))` |

Estas condiciones se combinan con la política de rol, tipo de operación y acceso al negocio. El frontend puede
enviar el UUID para mantener el contrato actual, pero PostgreSQL debe rechazar cualquier UUID distinto al actor
autenticado. Las políticas deben comprobar además que `(SELECT auth.uid()) IS NOT NULL`.

## 10. Migración de datos

### 10.1 Preflight obligatorio

Antes de aplicar cambios se debe registrar:

- Conteo de filas por tabla tenant.
- Usuarios y roles existentes.
- Usuarios de `auth.users` sin perfil en `public.users`.
- Perfiles sin usuario Auth.
- Relaciones huérfanas.
- Productos con códigos exactamente duplicados dentro del negocio objetivo.
- Estado de constraints, RLS, políticas y grants.
- Tamaño de tablas e índices.
- Versión real de PostgreSQL del proyecto remoto.

La migración debe abortar si:

- Existen filas huérfanas.
- Hay usuarios con rol nulo o inválido.
- No se identifica al administrador esperado.
- El backup o ensayo de restauración no está disponible.

### 10.2 Backfill

Todas las filas existentes de estas tablas se asignan a Full Calzado:

- `products`
- `inventory_movements`
- `transactions`
- `returns`
- `return_items`
- `cash_closes`
- `exchange_rates`
- `app_settings`

Todos los usuarios existentes reciben Full Calzado como negocio predeterminado.

Accesos iniciales:

- Administradores: acceso global por rol; no requieren filas para autorización.
- Empleados existentes: una fila de acceso a Full Calzado.
- Empleados de Zapatería Estilos: se crean o reasignan explícitamente después del backfill.

### 10.3 Conversión a `NOT NULL`

Orden:

1. Añadir columnas nullable.
2. Ejecutar backfill.
3. Verificar cero nulos.
4. Añadir y validar restricciones de integridad.
5. Convertir a `NOT NULL`.

En tablas grandes se usará `CHECK (...) NOT VALID`, seguido de `VALIDATE CONSTRAINT`, antes de `SET NOT NULL` para
reducir el bloqueo. La decisión final depende del tamaño observado en preflight.

## 11. Plan de implementación por fases

### Fase 0 — Preparación

- Crear backup verificable.
- Ensayar restauración fuera de producción.
- Ejecutar preflight.
- Confirmar usuarios iniciales y asignaciones.
- Definir tasa inicial de Zapatería Estilos.
- Preparar una ventana de despliegue fuera del horario operativo.

### Fase 1 — Esquema aditivo

- Crear `businesses` y `user_business_access`.
- Añadir `default_business_id` a `users`.
- Añadir `business_id` nullable a tablas tenant.
- Insertar los dos negocios.
- Crear índices iniciales necesarios para backfill y RLS.

Esta fase no activa todavía el switcher.

### Fase 2 — Backfill e integridad

- Asignar datos existentes a Full Calzado.
- Crear accesos iniciales.
- Migrar `app_settings` al modelo por negocio.
- Reemplazar restricciones globales.
- Crear claves foráneas tenant compuestas.
- Validar y convertir `business_id` a `NOT NULL`.

### Fase 3 — Seguridad y lógica de base de datos

- Crear helpers privados.
- Añadir frontera RLS restrictiva.
- Reemplazar políticas amplias.
- Aplicar la matriz de permisos por tabla y operación.
- Reescribir RPC y triggers.
- Revocar grants peligrosos.
- Revocar privilegios predeterminados.
- Conceder privilegios mínimos explícitos.
- Ejecutar tests de base de datos.

### Fase 4 — Frontend

- Regenerar tipos Supabase.
- Crear store de contexto de negocio.
- Integrarlo al bootstrap de autenticación existente.
- Añadir selector de negocio.
- Adaptar servicios, hooks, query keys y mutations.
- Adaptar gestión de usuarios.
- Actualizar seed y tests.
- En pruebas que simulen llamadas de aplicación, establecer explícitamente un contexto JWT autenticado para que
  `auth.uid()` resuelva al actor esperado. Los scripts de mantenimiento que carguen datos directamente deben usar
  un rol confiable y no deben introducir fallbacks de usuario en funciones operativas.

### Fase 5 — Corte coordinado fuera del horario operativo

Orden recomendado:

1. Confirmar que ningún empleado esté usando la plataforma y solicitar el cierre de pestañas abiertas.
2. Pausar cualquier escritura administrativa.
3. Verificar backup reciente.
4. Aplicar la migración.
5. Ejecutar smoke tests SQL.
6. Desplegar inmediatamente el frontend compatible.
7. Eliminar o revocar las firmas RPC antiguas para que un cliente obsoleto no pueda escribir con contratos viejos.
8. Iniciar sesión como administrador y como empleados de cada negocio.
9. Verificar aislamiento y permisos funcionales.
10. Reabrir la plataforma.

La ausencia de usuarios durante la ventana es una precondición del despliegue. Si no puede garantizarse, debe
usarse un bloqueo temporal de escrituras desde base de datos.

### Fase 6 — Limpieza

- Eliminar firmas RPC antiguas.
- Eliminar defaults temporales de compatibilidad si se usaron.
- Confirmar que no existen filas sin tenant.
- Ejecutar advisors de seguridad y rendimiento.
- Documentar IDs, asignaciones y resultado del despliegue.

## 12. Integración frontend

### 12.1 Estado de negocio

Se añadirá un store Zustand independiente del store de autenticación:

- `activeBusinessId`
- selección persistida por usuario
- operaciones síncronas de inicialización, cambio y limpieza

Reglas:

- La lista de negocios es estado remoto y pertenece a TanStack Query, no a Zustand.
- Zustand persiste únicamente IDs de selección; no duplica negocios ni estados de carga.
- La selección persistida se guarda por usuario y se valida contra accesos frescos.
- Para cumplir “el administrador inicia en Full Calzado”, una sesión nueva comienza en Full Calzado.
- Un refresh puede conservar la última selección accesible de cada usuario.
- Logout limpia negocio y caché.
- El store no guarda una bandera de autorización confiable.

La persistencia usa el middleware `persist` de Zustand sobre `localStorage`, con una clave versionada y un mapa
`userId -> businessId`. Esto evita compartir una selección global entre usuarios del mismo dispositivo.

### 12.2 Bootstrap de autenticación

El repositorio ya hidrata sesión en `src/routes/__root.tsx` y actualiza perfil en `src/main.tsx`.

La carga de negocios debe integrarse con el guard de la ruta autenticada:

- Login: guardar el perfil, precargar accesos y navegar.
- Refresh inicial: validar la sesión una sola vez por carga de la aplicación.
- Ruta autenticada: resolver accesos mediante `queryClient.ensureQueryData` y sincronizar la selección.
- `TOKEN_REFRESHED`: actualizar el perfil fuera del callback inmediato de `onAuthStateChange`.
- Logout: limpiar auth, negocio y `queryClient`.

No se debe crear un segundo listener que duplique todo el flujo de autenticación.

### 12.3 Servicios

Cada método tenant de `src/services` debe recibir `businessId`:

- `productsService`
- `inventoryMovementsService`
- `transactionsService`
- `returnsService`
- `cashClosesService`
- `exchangeRatesService`

Lecturas:

- Deben incluir `.eq("business_id", businessId)`.
- El filtro sigue siendo necesario para el administrador, aunque RLS le permita más filas.

Escrituras:

- Deben enviar `business_id` o usar una RPC que lo reciba y valide.
- Los inserts directos pueden mantener `user_id` o `updated_by` en el payload, pero el backend exige que sea igual
  a `auth.uid()`.
- Las RPC no reciben un `user_id` confiable; resuelven el actor internamente.

### 12.4 TanStack Query

Todas las query keys tenant deben incluir `businessId`.

Ejemplos conceptuales:

- `["products", businessId, "list", filters]`
- `["transactions", businessId, "today"]`
- `["exchange-rate", businessId, "current"]`

Reglas:

- Una query tenant permanece deshabilitada mientras `activeBusinessId` sea nulo.
- El cambio de negocio produce una key distinta y una carga distinta.
- Las invalidaciones deben apuntar al tenant afectado.
- No se debe usar TanStack Query para almacenar el negocio activo.
- `placeholderData` o `keepPreviousData` no debe conservar datos del negocio anterior durante un cambio de tenant.

### 12.5 Cambio de negocio

Al cambiar:

1. Cerrar modales operativos abiertos.
2. Impedir el cambio mientras exista una mutation crítica en curso o exigir confirmación.
3. Actualizar `activeBusinessId`.
4. Navegar a un estado válido del módulo actual.
5. Cargar queries del nuevo tenant.

Las mutations deben capturar el `businessId` al iniciarse; no deben leer un valor que pueda cambiar a mitad de la
operación.

## 13. Interfaces y contratos

### 13.1 Contexto de negocio

```ts
type BusinessContext = {
  activeBusinessId: string | null;
  selectedBusinessByUser: Record<string, string>;
};
```

La lista `Business[]` se obtiene desde React Query. Este contrato es estado de interfaz, no prueba de autorización.

### 13.2 RPC tenant

Toda RPC operativa debe seguir este patrón conceptual:

```text
input:
  p_business_id
  datos funcionales

actor:
  auth.uid()

validations:
  sesión válida
  acceso al negocio
  negocio activo para escritura
  relaciones del mismo tenant

output:
  resultado perteneciente a p_business_id
```

### 13.3 Error sin asignación

Si un usuario autenticado no tiene negocio:

- La aplicación no muestra módulos operativos.
- Muestra un estado explícito: “Usuario sin negocio asignado”.
- No elige el primer negocio global.
- El backend continúa negando acceso.

## 14. Estrategia de pruebas

### 14.1 Pruebas PostgreSQL con pgTAP

Ubicación: `supabase/tests/`.

Cobertura mínima:

- Empleado A puede leer su negocio.
- Empleado A no puede leer el negocio B, incluso sin filtro explícito.
- Empleado A no puede insertar, actualizar ni borrar en B.
- Administrador puede leer ambos negocios.
- Negocio inactivo rechaza escrituras.
- Códigos iguales funcionan en negocios diferentes.
- Solo existe un cierre por negocio y fecha.
- El cierre de A no agrega ventas, devoluciones o tasa de B.
- Venta, devolución y movimiento no pueden relacionar productos de otro tenant.
- Los triggers propagan `business_id`.
- Las RPC rechazan `anon`.
- Las RPC obtienen la identidad desde `auth.uid()`.
- Los inserts directos rechazan `user_id` o `updated_by` distintos de `auth.uid()`.
- Un empleado no puede autoasignarse acceso.
- Un empleado no puede modificar su rol ni el de otro usuario.
- Un empleado puede crear productos y entradas de inventario en su negocio.
- Un empleado no puede editar, desactivar ni eliminar productos.
- Admin y employee pueden insertar tasas y generar cierres.
- Las funciones y políticas enumeran explícitamente `admin` y `employee`; no utilizan una condición abierta que
  conceda acceso a cualquier rol futuro.
- La RPC de asignación revierte todo ante un error.
- Los usuarios autenticados pueden leer perfiles; solo operaciones administrativas pueden modificarlos.

Los tests deben crear usuarios Auth y perfiles deterministas dentro de una transacción y finalizar con `ROLLBACK`.

### 14.2 Pruebas frontend con Vitest

- Resolución de negocio predeterminado.
- Persistencia por usuario.
- Limpieza al cerrar sesión.
- Dispositivo compartido.
- Acceso revocado.
- Queries deshabilitadas sin negocio.
- Query keys separadas por negocio.
- Ausencia de datos anteriores como placeholder al cambiar de negocio.
- Payloads de mutations con el tenant correcto.
- Cierre de modales al cambiar.
- Usuario sin asignación.

### 14.3 Pruebas end-to-end o smoke tests

- Admin inicia en Full Calzado.
- Admin cambia a Zapatería Estilos.
- Los totales y tablas cambian sin recargar la SPA.
- Empleado de Full Calzado no ve el selector ni datos de Estilos.
- Empleado de Estilos no ve datos de Full Calzado.
- Crear producto con el mismo código en ambos negocios funciona.
- Venta en Estilos solo reduce stock de Estilos.
- Devolución y cierre afectan únicamente el negocio activo.

## 15. Criterios de aceptación

- **AC-001**: Dado un empleado asignado a Full Calzado, cuando consulta una tabla tenant sin filtro de negocio,
  entonces PostgreSQL no devuelve filas de Zapatería Estilos.
- **AC-002**: Dado el mismo empleado, cuando intenta insertar una fila de Estilos, entonces la operación es
  rechazada por la base de datos.
- **AC-003**: Dado un administrador, cuando cambia el negocio activo, entonces todas las queries visibles usan una
  cache key con el nuevo `businessId`.
- **AC-004**: Dada una venta en Estilos, cuando los triggers terminan, entonces la venta, el movimiento y el producto
  comparten el mismo `business_id`.
- **AC-005**: Dada una devolución en Full Calzado, entonces ningún producto ni movimiento de Estilos cambia.
- **AC-006**: Dado un cierre diario por negocio, entonces pueden existir dos cierres en la misma fecha, uno por
  negocio.
- **AC-007**: Dado un código de producto existente en Full Calzado, entonces el mismo código puede crearse en
  Estilos.
- **AC-008**: Dada una llamada no autenticada a una RPC operativa, entonces PostgreSQL rechaza su ejecución.
- **AC-009**: Dado un usuario que envía el ID de un administrador, entonces la operación conserva la identidad de
  `auth.uid()` y no eleva privilegios.
- **AC-010**: Dada una falla durante reasignación, entonces asignaciones y default anteriores permanecen intactos.
- **AC-011**: Dado un negocio inactivo, entonces su historial se conserva y no admite nuevas operaciones.
- **AC-012**: Dado el despliegue final, entonces no existen filas tenant con `business_id IS NULL`.
- **AC-013**: Dado un empleado, cuando crea un producto o una entrada de inventario en su negocio, entonces la
  operación es aceptada.
- **AC-014**: Dado un empleado, cuando intenta editar, desactivar o eliminar un producto, entonces PostgreSQL
  rechaza la operación.
- **AC-015**: Dado un insert directo con un `user_id` o `updated_by` ajeno, entonces `WITH CHECK` rechaza toda la
  sentencia.
- **AC-016**: Dado un rol futuro no incluido explícitamente en las políticas, cuando se incorpore al enum de roles,
  entonces no podrá ejecutar operaciones de inventario, venta, devolución, tasa o cierre hasta recibir políticas
  específicas.

## 16. Validación antes de producción

- [ ] Backup y restauración ensayados.
- [ ] Preflight sin huérfanos.
- [ ] Migración probada desde un `db reset` limpio.
- [ ] Seed actualizado para ambos negocios.
- [ ] Todos los tests pgTAP pasan.
- [ ] Todos los tests Vitest pasan.
- [ ] Build de producción pasa.
- [ ] Tipos Supabase regenerados.
- [ ] Advisors de seguridad revisados.
- [ ] Advisors de rendimiento revisados.
- [ ] Grants de `anon` revisados.
- [ ] Privilegios predeterminados revocados y grants explícitos verificados.
- [ ] Matriz `admin`/`employee` validada por tabla y operación.
- [ ] Funciones antiguas eliminadas.
- [ ] RLS verificado con usuarios reales de prueba.
- [ ] Smoke test de cada módulo en ambos negocios.
- [ ] Conteos post-migración coinciden con los conteos previos.
- [ ] Zapatería Estilos tiene tasa inicial.
- [ ] Administrador y empleados tienen asignación correcta.
- [ ] Ventana fuera de horario confirmada y pestañas operativas cerradas.

## 17. Rollback y recuperación

Antes de que Zapatería Estilos registre datos, una reversión lógica puede eliminar objetos nuevos y restaurar
constraints antiguas.

Después de registrar datos en ambos negocios:

- No se debe ejecutar un “down migration” destructivo.
- El rollback confiable es restaurar el backup anterior al despliegue.
- Si el frontend falla pero la base está íntegra, se debe mantener mantenimiento y desplegar una corrección; no
  borrar `business_id`.

La decisión de rollback debe basarse en:

- Fallo de aislamiento.
- Pérdida o mezcla de datos.
- Funciones críticas no operativas.
- Conteos post-migración inconsistentes.

## 18. Archivos previstos para la fase de implementación

Esta lista es informativa; aún no se han modificado:

- Nueva migración en `supabase/migrations/`.
- `supabase/seed.sql`.
- Nuevos y existentes tests en `supabase/tests/`.
- `src/types/supabase.ts`, regenerado.
- `src/types/index.ts`.
- Servicios tenant en `src/services/`.
- Query hooks en `src/features/`.
- Store de negocio.
- Bootstrap de autenticación.
- Selector de negocio en layout/sidebar.
- Gestión administrativa de usuarios.
- Tests Vitest afectados.

## 19. Riesgos abiertos de la migración

| ID      | Riesgo                                                                    | Tratamiento                                                                 |
| ------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| RSK-001 | Revocación de acceso mientras una pantalla está abierta.                  | RLS bloquea backend; refrescar contexto y manejar errores en UI.            |
| RSK-002 | Mutación en curso durante cambio de negocio.                              | Bloquear switch o cerrar/confirmar operación pendiente.                     |
| RSK-003 | Tamaño real de producción desconocido en el repositorio.                  | Medir antes de decidir estrategia de índices y `NOT NULL`.                  |
| RSK-004 | El dump suministrado puede no reflejar cambios posteriores al 2026-06-10. | Ejecutar `db pull` o inventario remoto inmediatamente antes de implementar. |

## 20. Fuentes técnicas

- [Supabase Row-Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Changelog](https://supabase.com/changelog)
- [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
- [Deuda técnica posterior a la migración](spec-process-deuda-tecnica-post-migracion.md)
