---
title: Deuda técnica y mejoras posteriores a la migración multi-negocio
version: 1.0
date_created: 2026-06-22
last_updated: 2026-06-22
owner: Anderson R. Román
tags:
  - process
  - technical-debt
  - security
  - reliability
  - post-migration
---

# Introducción

Este documento registra hallazgos detectados durante la auditoría de la migración multi-negocio que no son
necesarios para garantizar el aislamiento entre Full Calzado C.A. y Zapatería Estilos C.A.

Estos puntos no deben ampliar ni bloquear automáticamente el alcance de
[`spec-architecture-migracion-multi-negocio.md`](spec-architecture-migracion-multi-negocio.md), salvo que durante
la implementación se demuestre que uno de ellos afecta directamente la integridad del despliegue.

## 1. Propósito y alcance

El propósito es conservar decisiones y riesgos secundarios para una fase posterior, evitando que se pierdan
durante la implementación principal.

Incluye:

- Integridad financiera de devoluciones.
- Atomicidad de operaciones por lote.
- Concurrencia y bloqueo de stock.
- Normalización de códigos de producto.
- Evolución de permisos hacia un tercer rol.
- Endurecimiento de clientes SPA obsoletos.
- Integración efectiva de `app_settings`.

## 2. Hallazgos pendientes

### DT-001 — Validación financiera de devoluciones

`process_return` recibe desde el navegador precios en USD y VES. Un cliente modificado puede alterar el crédito,
la diferencia y, posteriormente, los totales del cierre.

Opciones de resolución:

1. Vincular cada devolución con transacciones originales y calcular el crédito desde datos persistidos.
2. Permitir importes manuales únicamente con aprobación administrativa.
3. Guardar una justificación y auditoría adicional cuando se modifiquen importes.

Prioridad recomendada: alta, pero independiente del aislamiento multi-negocio.

### DT-002 — Atomicidad de la carga de inventario por lote

La carga actual puede crear productos y movimientos mediante solicitudes HTTP independientes. Si una parte falla,
el lote puede quedar aplicado parcialmente.

Resolución recomendada:

- Crear una RPC transaccional que reciba el lote completo.
- Validar todas las filas antes de efectuar la primera escritura.
- Aplicar todo o revertir todo.

### DT-003 — Concurrencia y orden de bloqueo de stock

La migración ya bloquea con `SELECT ... FOR UPDATE` el producto afectado antes de leer `stock_before` y
actualizar el stock. El riesgo restante aparece en operaciones futuras que modifiquen varios productos dentro
de una misma transacción: si adquieren los bloqueos en órdenes distintos, pueden producir deadlocks.

Resolución recomendada:

- Bloquear múltiples productos en un orden determinista, por ejemplo `ORDER BY id`, para reducir deadlocks.
- Añadir pruebas concurrentes de venta, entrada y devolución.

### DT-004 — Normalización de códigos de producto

La unicidad propuesta es exacta por `(business_id, code)`. Por tanto, valores como `NK-39`, `nk-39` y `NK-39 `
podrían considerarse distintos.

Opciones de resolución:

- Normalizar con `trim` y mayúsculas antes de persistir.
- Usar un índice único sobre una expresión normalizada.
- Cambiar el tipo a `citext` si la comparación deseada es insensible a mayúsculas.

Esta decisión requiere confirmar las reglas comerciales de los códigos.

### DT-005 — Modelo de capacidades para nuevos roles

La migración utiliza comprobaciones explícitas para `admin` y `employee`, dejando futuros roles sin acceso por
defecto. Esto es seguro para incorporar un tercer rol, pero un crecimiento sostenido de roles hará difícil
mantener condiciones repetidas.

Evolución recomendada:

- Definir capacidades como `inventory.create`, `inventory.edit`, `sale.create`, `cash_close.create` y
  `exchange_rate.update`.
- Asociar capacidades a roles en tablas de autorización.
- Mantener el aislamiento de negocio como una condición independiente de las capacidades.

No se debe implementar este modelo antes de definir formalmente el tercer rol.

### DT-006 — Protección frente a una SPA obsoleta

La migración se desplegará fuera del horario operativo y exige cerrar pestañas. Como endurecimiento adicional,
puede implementarse un mecanismo que fuerce la recarga cuando la versión del frontend sea inferior a la versión
mínima aceptada por el backend.

Opciones:

- Endpoint o ajuste de versión mínima.
- Cabecera de versión validada por funciones críticas.
- Detección de nueva compilación y recarga al recuperar foco.

### DT-007 — Integración de `app_settings`

La tasa visible actualmente se obtiene de `exchange_rates`. `app_settings.exchange_rate_mode` existe en base de
datos, pero la SPA no lo consulta.

Trabajo posterior:

- Definir la interfaz para alternar entre modo `manual` y `bcv`.
- Consultar `app_settings` por negocio.
- Implementar el proceso que obtiene y registra la tasa BCV cuando el modo sea `bcv`.
- Determinar qué ocurre si el proveedor externo no está disponible.

## 3. Criterios de priorización

Un hallazgo se mueve al alcance activo cuando cumple al menos una condición:

- Puede provocar pérdida o corrupción de datos.
- Puede alterar importes financieros sin autorización.
- Se reproduce en producción.
- Bloquea la incorporación del tercer rol.
- Impide una operación comercial frecuente.

## 4. Validación futura

- [ ] Devoluciones calculadas desde datos confiables.
- [ ] Cargas por lote atómicas.
- [ ] Pruebas de concurrencia de stock.
- [ ] Regla comercial de normalización de códigos definida.
- [ ] Capacidades del tercer rol documentadas.
- [ ] Estrategia para clientes obsoletos definida.
- [ ] `app_settings` integrado al modo manual/BCV.

## 5. Referencias

- [Especificación principal de migración](spec-architecture-migracion-multi-negocio.md)
- [Supabase Row-Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
