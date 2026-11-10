---
title: Módulo de Cuentas por Cobrar Cashea (especificación para implementación)
version: 1.2
date_created: 2026-11-06
last_updated: 2026-11-10
owner: Anderson R. Román
tags:
  - feature
  - cashea
  - cuentas-por-cobrar
  - cierre-de-caja
  - supabase
  - frontend
---

# Introducción

Este documento reúne lo necesario para implementar el módulo de Cuentas por Cobrar Cashea en Full Calzado: el contexto
de negocio, las decisiones ya tomadas, los requisitos con criterios de aceptación, el diseño técnico propuesto sobre
la base de código actual, el plan por etapas y las preguntas abiertas.

Este documento no implementa código. Todo lo que dependa de datos que aún no se han visto en el panel real de Cashea
está marcado como **por verificar**.

## 1. Contexto y objetivo

### 1.1 Qué es Cashea para la tienda

Cashea es una aplicación venezolana de compra a cuotas. Cuando un cliente compra con Cashea en la tienda:

1. El cajero crea la orden en el panel web de Cashea (no en Full Calzado).
2. El cliente paga en la tienda una parte inicial (**cobrar hoy**).
3. Cashea financia el resto (**monto financiado**) y el cliente se lo paga a Cashea en cuotas.
4. Cashea **adelanta** a la tienda el monto financiado, descontando comisiones, en bolívares y con la frecuencia que el
   comercio haya elegido (semanal, quincenal o mensual; la tienda usará semanal). Según el centro de ayuda de Cashea,
   Cashea asume los impagos del comprador.

Por eso, lo financiado es una **cuenta por cobrar a Cashea**, no dinero en caja.

### 1.2 Problema actual

- Full Calzado no tiene el concepto de forma de pago: `create_sale` solo recibe renglones y tasa
  (`supabase/migrations/20260808052019_create_atomic_multi_line_sales.sql`).
- El cierre de caja trata todo lo facturado como dinero en caja
  (`private.get_cash_close_summary`, migración `20260808062414_count_billed_operations_in_cash_closes.sql`), y
  `CONTEXT.md` define **Total producido** como la cifra real resultante en caja. Con ventas Cashea, el Total producido
  incluiría lo financiado, que aún no está en caja: el cuadre fallaría cada día con ventas financiadas.
- Las devoluciones (`private.process_return`) no están ligadas a la venta original, así que el sistema no puede saber si
  lo devuelto fue una compra Cashea.

### 1.3 Objetivo

Registrar las ventas Cashea, separarlas del dinero en caja, controlar lo que Cashea debe a cada negocio y conciliar los
depósitos que Cashea hace (en bolívares y netos de comisiones).

## 2. Decisiones ya tomadas

| # | Decisión |
|---|----------|
| D-01 | **Registro manual.** No se integra con Cashea: el personal registra en Full Calzado las órdenes y los depósitos. |
| D-02 | **Copiar y pegar es la base del registro**, con ingreso manual siempre disponible como respaldo. |
| D-03 | El texto pegado **no se guarda**. Solo se guardan los valores reconocidos. No se almacena nombre ni cédula del comprador. |
| D-04 | Se registran cinco datos por orden, todos obligatorios: número de orden, total de la orden Cashea, cobrado hoy, financiado y número de factura. El total se captura (pegado o escrito) y el formulario calcula cobrado hoy + financiado para verificarlo contra él. |
| D-05 | El cierre de caja descuenta del **Total producido** lo que quedó **por cobrar a Cashea** y lo muestra como «Por cobrar Cashea». El Total producido conserva su nombre y su significado (cifra real resultante en caja); no se crea otra cifra para el dinero en caja. No se tocan las funciones de períodos del dashboard, que trabajan con Total facturado. |
| D-06 | Los cierres de caja ya generados no se recalculan (coherente con `docs/adr/0001-ventas-con-identidad-sin-reconstruir-el-historico.md`). |
| D-07 | Las comisiones (servicio y adelanto) son **editables por negocio** en Ajustes; no se fijan en código. |
| D-08 | El depósito se registra **en bolívares**, con tasa aplicada opcional; el sistema calcula la **tasa implícita**. |
| D-09 | El estado de la cuenta por cobrar en Full Calzado (Pendiente, Cobrada, Anulada) significa si Cashea ya depositó esa orden a la tienda. Es independiente del estado de la orden en Cashea (por ejemplo «En Progreso» mientras el cliente paga sus cuotas). |
| D-10 | Solo el Administrador registra cobros, reversiones de depósito, anulaciones, ajustes y cambia las comisiones. El empleado registra la venta Cashea. |
| D-11 | Fuera de alcance: devoluciones de ventas Cashea (se gestionan por anulación o ajuste), método de pago del cliente, conciliación bancaria automática, exportaciones PDF o Excel, comparaciones entre negocios. |
| D-12 | Los importes de un cierre de caja no cambian nunca (D-06), pero la tabla de cierres muestra además un **indicador Cashea por día** que sí es estado vivo: cambia cuando se registran depósitos, anulaciones o ajustes. Ver REQ-010. |

## 3. Estado de la evidencia

No hay acceso al panel real de Cashea. Las pantallas provienen de un tutorial público en video con datos demo
(fechas de septiembre de 2024), así que los nombres y el orden de los campos pueden diferir del panel actual.

| Dato | Fuente | Confianza |
|------|--------|-----------|
| Flujo de creación de orden (stepper de 5 pasos) y resumen «Debe pagar» | Capturas del tutorial | Media: verificar con una orden real |
| Pantallas «Órdenes» y «Detalle de orden» | Capturas del tutorial | Media |
| El «ID» del resumen es el número de factura, no un identificador de orden | Aclaración del usuario sobre el tutorial | Alta (para el tutorial) |
| Comisión de 4% sobre el total de las ventas Cashea de la semana y 4% sobre el monto financiado | Información del usuario | Media: verificar con el primer depósito |
| Estructura oficial: servicio tecnológico (2% o 5% de cada venta Cashea según el negocio) y tarifa por adelanto (2% a 4% de lo financiado) | Texto de la página oficial de Cashea | Alta en la estructura; los valores dependen del contrato |
| Folleto de ~marzo 2025 (4% general, activación de $200, mínimo mensual de $100) | Imagen | Baja: desactualizado, no usar sus porcentajes |
| Frecuencia de depósito: elegida por el comercio; se usará semanal | Usuario | Media |
| Depósito siempre en bolívares a tasa BCV; no está claro si es la de inicio de semana, la del día de pago o una fija a inicio de mes | Usuario | Baja: por eso existe la tasa implícita |

## 4. Flujo de Cashea en caja (referencia)

Panel web de Cashea, rol cajero. «Crear orden» abre un stepper de 5 pasos:

1. **Importe:** total de la orden.
2. **Scan QR:** el cliente escanea el QR de la caja con la app.
3. **Seguridad:** se verifica la cédula del cliente y su nombre. Es el único paso donde aparecen datos personales.
4. **ID Factura:** número de la factura emitida (Full Calzado no emite factura fiscal; la hace otro sistema). Aquí ya aparece un resumen.
5. **Confirmar:** muestra el resumen **«Debe pagar»** y pregunta cómo pagó el cliente lo cobrado hoy (Efectivo, Zelle, Otro; todo pago en bolívares es «Otro»).

Resumen «Debe pagar» (solo aparece en este paso, ordenado y fácil de leer; después la información queda dispersa):

| Etiqueta | Ejemplo | Significado |
|----------|---------|-------------|
| # Orden | 6400685 | Número de orden en Cashea |
| Total | $ 185.6 | Total de la compra |
| Cobrar hoy | $ 92.80 | Inicial que paga el cliente en la tienda |
| Financiado | $ 92.80 | Lo que Cashea adeudará a la tienda |
| ID | 551-000738 | **Número de factura** introducido en el paso 4 |

Otras vistas (información dispersa):

- **Órdenes:** tabla con canal, # de orden, sucursal, caja, # de factura, fecha, total y estado; filtros por rango de fechas, # de factura, # de orden, # de cédula y caja. No muestra cobrar hoy ni financiado.
- **Detalle de orden (modal):** sucursal, fechas de creación y facturación, # de factura editable, estado de la entrega, estado de la orden («En Progreso»), monto total, «Información del usuario» (colapsable) e historial de cuotas (pago inicial con método y estado, luego cuotas «A pagar» cada 14 días). Botones: Hacer un cambio, Cancelar orden, Guardar. Ejemplo: total $92.80 = inicial $46.40 + 3 cuotas de $15.47 (el financiado equivale a total menos pago inicial; las cuotas pueden redondear centavos).

## 5. Glosario propuesto (para `CONTEXT.md`)

Usar estos términos en UI, código y pruebas. Añadirlos a `CONTEXT.md` al implementar (ver `docs/agents/domain.md`).

**Venta Cashea**:
Venta cuyo importe se paga en parte en la tienda y en parte mediante financiamiento de Cashea. Tiene una Orden Cashea asociada.
_Avoid_: Venta a crédito, venta a cuotas

**Orden Cashea**:
Registro en Full Calzado de la orden creada en el panel de Cashea para una Venta Cashea: número de orden, Total de la orden, Cobrado hoy, Monto financiado y número de factura.

**Cobrado hoy**:
Parte de una Venta Cashea que el cliente paga en la tienda en el momento de la compra. Es lo que entra a caja.
_Avoid_: Inicial, anticipo

**Monto financiado**:
Parte de una Venta Cashea que Cashea adeuda a la tienda. Es una Cuenta por cobrar Cashea, no dinero en caja.

**Cuenta por cobrar Cashea**:
Monto financiado de una Orden Cashea mientras Cashea no lo haya depositado. Estados: Pendiente, Cobrada, Anulada.

**Por cobrar Cashea**:
Etiqueta del cierre de caja: suma del Monto financiado de las Órdenes Cashea no anuladas de las Ventas del período, aunque Cashea las deposite después. Se descuenta del Total producido.

**Depósito Cashea**:
Pago agrupado que Cashea hace a la tienda, en bolívares y neto de comisiones, por una o varias Órdenes Cashea.
_Avoid_: Lote, liquidación

**Comisión Cashea**:
Suma del servicio (porcentaje sobre el total de la Venta Cashea) y la tarifa de adelanto (porcentaje sobre el Monto financiado), definidos por negocio.

**Neto esperado**:
Monto financiado menos la Comisión Cashea de una orden, en dólares.

**Tasa implícita**:
Bolívares recibidos en un Depósito Cashea entre el Neto esperado de sus órdenes. Sirve para descubrir qué tasa aplica Cashea.

**Total producido** (ya existe en `CONTEXT.md`; se ajusta su definición):
Cifra real resultante en caja durante un período, después de aplicar al Total facturado los créditos de devoluciones, las diferencias generadas por Cambios y lo que quedó Por cobrar Cashea.
_Avoid_: Total facturado, ganancia

> `CONTEXT.md` ya define **Total producido** como «cifra real resultante en caja»: al implementar solo hay que añadir «y lo que quedó Por cobrar Cashea» a esa definición. No se introduce un término nuevo para el dinero en caja.

### 5.1 ADR sugerido

Crear `docs/adr/0002-cashea-registro-manual-con-cuentas-por-cobrar.md` con la decisión: las ventas Cashea se registran
manualmente (con ayuda de pegado de texto), el Total producido conserva su nombre y su significado (cifra real
resultante en caja) y descuenta lo financiado, que el cierre de caja muestra como «Por cobrar Cashea»; los cierres
anteriores no se recalculan. Alternativas rechazadas: restar lo financiado del Total facturado (alteraría el ticket
promedio y los períodos del dashboard) y añadir una cifra nueva para el dinero en caja.

## 6. Requisitos

### 6.1 Etapa 1: venta Cashea, pegado, comisiones y cierre de caja

- **REQ-001 (Venta con Cashea):** En «Registrar Venta» (OutModal) existe la opción «Pago con Cashea». Al activarla se capturan cinco datos, todos obligatorios: número de orden (texto), total de la orden Cashea (USD), cobrado hoy (USD), monto financiado (USD) y número de factura (texto). El total se captura (pegado o escrito) y el formulario calcula cobrado hoy + financiado y lo muestra junto al total.
  - Aceptación: no se puede confirmar la venta con alguno de esos cinco datos vacío. Con «Pago con Cashea» activo y datos incompletos o inválidos, ni el botón ni el atajo Shift + Enter abren la confirmación.
  - Aceptación: los montos admiten como máximo dos decimales; total > 0, financiado > 0 y cobrado hoy ≥ 0.
  - Aceptación: no se puede confirmar si cobrado hoy + financiado ≠ total de la orden Cashea (tolerancia de $0.01); el formulario muestra la suma calculada y la diferencia. Esta validación vive en el formulario y en el `check` de la base de datos, no en el parser.
  - Aceptación: si el total de la orden Cashea difiere del total de la venta (suma de renglones) en más de $0.01, se muestra una advertencia y el cajero debe confirmarla; no bloquea. El total de la orden no se precarga con el total de la venta, para que la comparación siga siendo independiente.
  - Aceptación: si el monto financiado supera el total de la venta (suma de renglones), no se puede confirmar: el Total producido de esa venta quedaría negativo.
  - Aceptación: el diálogo de confirmación muestra por separado «Entra a caja hoy» (cobrado hoy) y «Por cobrar a Cashea» (financiado). La suma no detecta dos montos intercambiados; esta lectura sí.
  - Aceptación: el número de orden no puede repetirse entre las órdenes no anuladas del mismo negocio. El número de una orden anulada puede volver a usarse, y el mismo número puede existir en el otro negocio. Si se repite, el cajero ve el mensaje específico del servidor, no el error genérico de venta (hoy el toast usa `MODAL_SUBMISSION_ERROR_MESSAGES.sale`).
  - Aceptación: la RPC repite todas las validaciones anteriores; el formulario no es la autoridad.
  - Aceptación: la venta, la Orden Cashea y el descuento de inventario se registran en una sola transacción; si algo falla no queda nada a medias.
  - Aceptación: al cerrar el modal o registrar la venta, los datos Cashea se limpian igual que los renglones pendientes.
  - Aceptación: la venta aparece marcada como Cashea en el listado de ventas.
- **REQ-002 (Pegar resumen de Cashea):** El formulario Cashea tiene un campo para pegar el resumen de la orden. Se ejecuta el parser de la sección 7.4 y se rellenan los campos reconocidos.
  - Aceptación: lo reconocido se muestra en los campos editables antes de confirmar; nunca se guarda ni se envía solo.
  - Aceptación: lo que no se reconoce se ignora: el campo queda vacío para que el cajero lo llene a mano, sin avisos ni mensajes de error del parser. Como los cinco datos son obligatorios, no se podrá confirmar hasta completarlo. El ingreso manual siempre funciona.
  - Aceptación: un segundo pegado solo reemplaza los campos que reconoce; no vacía los que el cajero ya llenó.
  - Aceptación: el texto pegado no se persiste ni se registra en logs. Se analiza al pegar y el área de pegado se vacía; el texto no queda en el estado del formulario.
- **REQ-003 (Configuración de comisiones):** En Ajustes, el Administrador define por negocio el porcentaje de servicio (sobre el total) y el porcentaje de adelanto (sobre lo financiado). Valores iniciales: 4% y 4% (por verificar). Cada Orden Cashea guarda una **copia** de los porcentajes vigentes al registrarse, de modo que cambiarlos no altera el neto esperado de órdenes ya registradas.
  - Aceptación: solo el Administrador modifica los porcentajes; la base de datos rechaza el cambio de un empleado (RPC con verificación de rol, sin `grant update` sobre esas columnas).
  - Aceptación: el empleado puede leerlos. No son un secreto dentro del negocio: REQ-009 ya le deja ver el neto esperado de cada orden, que los revela, y la política de lectura actual de `app_settings` cubre a todo usuario con acceso al negocio.
- **REQ-004 (Cierre de caja con Cashea):** El resumen del cierre diario añade «Por cobrar Cashea» (suma del monto financiado de las Órdenes Cashea no anuladas de ventas de ese día, en USD y en VES con la tasa de cada venta) y lo descuenta del **Total producido**, que conserva su nombre y su significado (cifra real resultante en caja): Total producido = cálculo actual (`net_usd`, `net_ves`: facturado menos créditos de devoluciones, con las diferencias por Cambios) menos Por cobrar Cashea. No se agrega ninguna otra cifra.
  - Aceptación: con una venta de $185.60, $92.80 cobrados hoy y $92.80 financiados, sin devoluciones, el cierre muestra Total facturado $185.60, Por cobrar Cashea $92.80 y Total producido $92.80.
  - Aceptación: el cobro posterior del depósito de Cashea (REQ-006) no se suma al Total producido de ningún día; se controla en la página Cashea.
  - Aceptación: los cierres anteriores a la migración no cambian (columnas nuevas con `null`).
  - Aceptación: el bloque de descuentos y el Total producido se muestran cuando hay devoluciones **o** ventas Cashea. Hoy `MetricsSummary` y `CashCloseModal` solo los muestran si `returnsCount > 0`; sin este cambio, un día con Cashea y sin devoluciones no mostraría ni «Por cobrar Cashea» ni el Total producido.
  - Aceptación: el equivalente en Bs. de lo financiado usa la tasa de la venta guardada en la Orden Cashea, no la tasa vigente al consultar.
  - Aceptación: el Total producido del dashboard diario y el del resumen «Ventas de hoy» coinciden con el resumen del cierre del día en curso.
  - Aceptación: el Total facturado, el ticket promedio y las funciones de períodos del dashboard no cambian.

### 6.2 Etapa 2: cuentas por cobrar, cobros y ajustes

- **REQ-005 (Cuentas por cobrar):** Nueva página «Cashea» por negocio activo con la lista de Órdenes Cashea: número de orden, factura, fecha, total, cobrado hoy, financiado, neto esperado, estado y antigüedad en días (hoy en `America/Caracas` menos la fecha de la venta). Filtros por estado y rango de fechas (parámetros de búsqueda validados con zod). Se muestran dos totales de las órdenes Pendientes: **saldo pendiente** (suma de lo financiado) y **neto esperado** (lo que debería llegar después de comisiones).
  - Aceptación: nunca muestra órdenes de otro negocio.
- **REQ-006 (Cobro por depósito):** El Administrador selecciona una o varias órdenes Pendientes e indica bolívares recibidos, fecha, referencia y, opcionalmente, la tasa aplicada. El sistema calcula neto esperado total, tasa implícita (bolívares recibidos ÷ neto esperado) y, si hay tasa aplicada, el equivalente recibido en USD y la diferencia («comisiones y ajustes»).
  - Aceptación: cobrar una orden individual usa el mismo flujo con una sola orden.
  - Aceptación: las órdenes quedan Cobradas de forma atómica; una orden anulada, ya cobrada, repetida en la selección o de otro negocio hace fallar toda la operación. Una selección vacía también.
  - Aceptación: la fecha del depósito no puede ser futura y los bolívares recibidos deben ser mayores a cero.
  - Aceptación: diferencias menores a $0.05 por redondeo no se marcan como discrepancia.
  - Aceptación: si el neto esperado total es cero o negativo, el depósito se registra sin tasa implícita (no hay división entre cero).
  - Aceptación: funciona igual con depósitos semanales, quincenales o mensuales (no depende de la frecuencia).
  - Aceptación: **un depósito mal registrado se puede revertir.** El Administrador lo revierte con una nota obligatoria: sus órdenes vuelven a Pendiente y el depósito queda marcado como revertido, sin borrarse. Sin esto, un monto o una orden equivocados no tendrían corrección, porque anular y ajustar solo aplican a órdenes Pendientes.
  - Supuesto: Cashea paga órdenes completas. Un pago parcial de una orden no se modela; la diferencia queda en «comisiones y ajustes».
- **REQ-007 (Anulación y ajuste):** El Administrador puede anular una orden Pendiente o ajustarla, siempre con una nota obligatoria. El ajuste cubre los tres montos y también el número de orden y el número de factura, para corregir errores de tecleo. Se conserva el historial de cada ajuste (valores anteriores, nuevos, nota, usuario, fecha) y, en la anulación, quién, cuándo y por qué. No afecta inventario ni cierres ya generados.
  - Aceptación: el ajuste respeta las mismas reglas que el registro (REQ-001): suma, montos válidos, financiado no mayor que el total de la venta y número de orden sin repetir.
  - Aceptación: una orden Cobrada no se anula ni se ajusta; primero se revierte su depósito (REQ-006).
  - Aceptación: anular o ajustar una orden de un día ya cerrado no cambia ese cierre (D-06). El resumen en vivo de esa fecha y el indicador (REQ-010) reflejan el estado actual y pueden diferir del cierre guardado; el cierre guardado es la referencia del día.
  - Aceptación: anular la orden no anula la venta. La venta sigue facturada y su inventario descontado; si la mercancía volvió, se registra la devolución por el flujo existente (ver Q-07).
- **REQ-008 (Tarjeta en dashboard):** El dashboard muestra el saldo pendiente por cobrar a Cashea (suma de lo financiado de las órdenes Pendientes), la cantidad de órdenes pendientes y la antigüedad de la más vieja, para el negocio activo.
- **REQ-009 (Permisos):** Empleado y Administrador con acceso al negocio pueden ver las cuentas por cobrar; solo el Administrador ejecuta REQ-006, REQ-007 y modifica REQ-003. La base de datos es la autoridad final (RPC con verificación de rol), no solo el frontend.

- **REQ-010 (Indicador Cashea en la tabla de cierres):** La tabla de cierres de caja tiene una columna angosta que comunica, por día, el estado del cobro a Cashea de las ventas de ese día. Usa el logo de Cashea (imagen que aporta Anderson al repositorio):
  - Sin ventas Cashea ese día, o solo con órdenes anuladas: la celda queda vacía.
  - **Logo en gris:** hubo ventas Cashea y al menos una orden no anulada del día sigue Pendiente (aún no depositada).
  - **Logo a color con palomita verde:** todas las órdenes no anuladas del día están Cobradas (depósito confirmado).
  - Aceptación: un depósito que incluye órdenes de varios días (el semanal, por ejemplo) actualiza el indicador de cada uno de esos días; un día con órdenes Cobradas y Pendientes permanece en gris hasta cobrar la última.
  - Aceptación: el indicador se actualiza al registrar o revertir un depósito (REQ-006), anular o ajustar una orden (REQ-007) o registrar una venta Cashea, sin recargar la página (invalidación de la consulta). La aplicación no usa tiempo real: otra sesión abierta lo ve al refrescar sus consultas.
  - Aceptación: el estado no depende solo del color: cada celda lleva `title` y `aria-label` («Cashea: depósito pendiente, 2 de 3 órdenes cobradas» y «Cashea: depósito confirmado»), como la columna Devoluciones ya usa `title`.
  - Aceptación: los importes del cierre (Total producido, Por cobrar Cashea) no cambian cuando el indicador pasa a confirmado (D-06, D-12).
  - Aceptación: solo se consideran órdenes del negocio activo; los cierres previos al módulo no muestran indicador.
  - Aceptación: el clic en la fila sigue llevando a las ventas del día; el indicador no es interactivo.

### 6.3 Fuera de alcance

Ver D-11. En particular, no se registra el método de pago del cliente (Pago Móvil, Biopago, tarjeta, transferencia, efectivo): hoy el sistema no guarda forma de pago en ninguna venta, y hacerlo solo para Cashea dejaría un desglose parcial. Si se requiere, debe diseñarse para todas las ventas y desglosarse en el cierre de caja.

## 7. Diseño técnico propuesto

### 7.1 Modelo de datos

Convenciones a respetar (observadas en las migraciones existentes): tablas y columnas en inglés `snake_case`, `business_id` en toda tabla operativa, claves compuestas `(business_id, id)` para impedir cruces entre negocios, funciones `private.*` con `security definer` y `set search_path = ''`, wrappers `public.*` con `security invoker`, RLS de lectura con `private.has_business_access(business_id)`, escritura solo mediante RPC (`revoke` de insert, update y delete a `authenticated`), mensajes de error en español, fechas con zona `America/Caracas`.

**Nuevo enum:** `public.cashea_order_status` = `pending | collected | voided`.

**`public.cashea_orders`**

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid pk | default `gen_random_uuid()`; `unique (business_id, id)` para las FK compuestas que la referencian |
| business_id | uuid not null | FK a `businesses`, `on delete restrict` |
| sale_id | uuid not null | FK compuesta `(business_id, sale_id)` a `sales(business_id, id)`; `unique (business_id, sale_id)`: una venta tiene como máximo una Orden Cashea |
| sale_date | date not null | copia de `sales.date`, que no cambia. Evita un join en el cierre, el indicador, los filtros y la antigüedad |
| exchange_rate | numeric(12,4) not null | copia de la tasa de la venta (`p_exchange_rate`), `> 0`. Con ella se calcula el equivalente en Bs. de lo financiado |
| order_number | text not null | recortado, de 1 a 40 caracteres; índice único parcial `(business_id, order_number) where status <> 'voided'` |
| invoice_number | text not null | recortado, de 1 a 40 caracteres |
| total_usd, paid_today_usd, financed_usd | numeric(12,2) not null | `check (abs(paid_today_usd + financed_usd - total_usd) <= 0.01)`, `check (total_usd > 0)`, `check (financed_usd > 0)`, `check (paid_today_usd >= 0)` |
| service_fee_pct, advance_fee_pct | numeric(5,2) not null | copia de los porcentajes vigentes al registrar |
| expected_net_usd | numeric(12,2) not null | calculado al registrar (ver 7.5). Sin `check` de signo: con un financiado muy bajo puede ser cero o negativo |
| status | cashea_order_status not null | default `pending` |
| deposit_id | uuid null | **Etapa 2.** FK compuesta `(business_id, deposit_id)` a `cashea_deposits(business_id, id)` |
| collected_at | timestamptz null | **Etapa 2** |
| voided_at, voided_by, void_note | timestamptz, uuid, text; null | **Etapa 2.** Quién, cuándo y por qué se anuló |
| created_by | uuid not null | FK a `users`, `on delete restrict` |
| created_at | timestamptz not null | default `now()` |

La migración de la Etapa 1 crea la tabla sin las columnas marcadas «Etapa 2»; la de la Etapa 2 las añade junto con `cashea_deposits`, porque `deposit_id` referencia una tabla que en la Etapa 1 aún no existe.

Coherencia de estado (un `check`, Etapa 2): `collected` exige `deposit_id` y `collected_at`; `voided` exige `voided_at`, `voided_by` y `void_note`; `pending` exige los cinco en `null`.

Índices: `(business_id, sale_date)`, `(business_id, status)` y `(business_id, deposit_id) where deposit_id is not null`.

**`public.cashea_deposits`**

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid pk | default `gen_random_uuid()` |
| business_id | uuid not null | FK a `businesses`; `unique (business_id, id)` |
| deposit_date | date not null | no futura (se valida en la RPC con la fecha de `America/Caracas`) |
| received_ves | numeric(14,2) not null | `> 0` |
| applied_rate | numeric(12,4) null | `> 0` si existe |
| expected_net_usd | numeric(12,2) not null | suma de las órdenes incluidas |
| implied_rate | numeric(12,4) null | `received_ves / expected_net_usd`; `null` si el neto esperado es ≤ 0 |
| difference_usd | numeric(12,2) null | solo si hay `applied_rate` |
| reference | text null | |
| reverted_at, reverted_by, revert_note | timestamptz, uuid, text; null | Reversión (REQ-006). Los tres juntos o ninguno |
| created_by, created_at | | como en `cashea_orders` |

Un depósito revertido conserva sus importes como rastro; sus órdenes vuelven a `pending` con `deposit_id` en `null`.

**`public.cashea_order_adjustments`** (auditoría): `id`, `business_id`, `order_id` (FK compuesta `(business_id, order_id)` a `cashea_orders`), valores anteriores y nuevos de total, cobrado hoy, financiado, número de orden y número de factura, `note` (obligatoria), `created_by`, `created_at`.

**Ajustes por negocio:** añadir a `public.app_settings` (ya existe una fila por negocio, con `business_id` como clave primaria) las columnas `cashea_service_fee_pct` y `cashea_advance_fee_pct` (`numeric(5,2) not null default 4.00`, `check` entre 0 y 100). Verificado en `20260622153214_migrate_to_multi_business.sql`:

- `app_settings_select` deja leer a todo usuario con acceso al negocio (coherente con REQ-003).
- `authenticated` solo tiene `grant update (exchange_rate_mode, updated_by, updated_at)`. Las columnas nuevas no quedan actualizables desde el cliente; solo se cambian con `update_cashea_settings`. **No ampliar ese `grant`.**
- El frontend hoy no lee `app_settings`; el servicio Cashea añade esa lectura.

**`public.cash_closes`:** columnas nuevas nullable `cashea_receivable_usd` y `cashea_receivable_ves` (`numeric(12,2)`, `check` ≥ 0 o `null`; desglose de lo descontado; los cierres históricos quedan en `null` y no se recalculan). `total_usd` y `total_ves` ya guardan el Total producido (`net_usd`, `net_ves`), así que en los cierres nuevos vendrán con el descuento incluido. `generate_daily_cash_close` hace `on conflict (business_id, date) do update`: las columnas nuevas deben ir también en esa lista de `set`, o un segundo cierre del mismo día las dejaría desactualizadas.

**RLS:** `enable row level security` y `select` con `private.has_business_access(business_id)` en las tres tablas nuevas; sin políticas de escritura; `revoke all` a `public`, `anon` y `authenticated`, luego `grant select` a `authenticated` y `grant all` a `service_role`; escritura solo por RPC.

### 7.2 Funciones (RPC)

| Función | Rol | Comportamiento |
|---------|-----|----------------|
| `create_cashea_sale(p_business_id, p_items, p_exchange_rate, p_cashea jsonb)` | Operativo | **Función nueva; `create_sale` no se modifica.** Valida `p_cashea` (objeto con `order_number`, `invoice_number`, `total_usd`, `paid_today_usd` y `financed_usd`; textos recortados y no vacíos; reglas de REQ-001), llama a `private.create_sale(...)` y, en la misma transacción, inserta la Orden Cashea con `sale_date`, `exchange_rate`, copia de los porcentajes vigentes y `expected_net_usd`. Rechaza si `financed_usd` supera el total de la venta recién creada. Convierte la violación de unicidad en «Ya existe una Orden Cashea con ese número en este negocio». Devuelve el `sale_id`. |
| `register_cashea_deposit(p_business_id, p_order_ids uuid[], p_received_ves, p_applied_rate, p_deposit_date, p_reference)` | Administrador | Rechaza la lista vacía o con repetidos. Bloquea las órdenes en orden estable (`order by id for update`) para no provocar interbloqueos entre dos cobros simultáneos. Exige encontrar tantas órdenes como identificadores recibidos, todas del negocio y en `pending`. Crea el depósito, las marca Cobradas y calcula tasa implícita (o `null`) y diferencia. |
| `revert_cashea_deposit(p_business_id, p_deposit_id, p_note)` | Administrador | Solo un depósito no revertido. Devuelve sus órdenes a `pending` (`deposit_id` y `collected_at` en `null`) y marca el depósito como revertido con nota. No borra nada. |
| `void_cashea_order(p_business_id, p_order_id, p_note)` | Administrador | Solo desde `pending`, con `for update`. Guarda `voided_at`, `voided_by` y `void_note`. |
| `adjust_cashea_order(p_business_id, p_order_id, p_order_number, p_invoice_number, p_total_usd, p_paid_today_usd, p_financed_usd, p_note)` | Administrador | Solo desde `pending`, con `for update`. Aplica las reglas de REQ-001, recalcula `expected_net_usd` con los porcentajes copiados en la orden y registra la auditoría. |
| `update_cashea_settings(p_business_id, p_service_fee_pct, p_advance_fee_pct)` | Administrador | Actualiza las dos columnas de `app_settings`, además de `updated_by` y `updated_at`. |
| `get_cashea_receivable_summary(p_business_id)` | Con acceso | Para el dashboard: saldo pendiente (suma de `financed_usd`), neto esperado, cantidad de órdenes `pending` y fecha de la venta más antigua. Sin órdenes pendientes devuelve ceros y fecha `null`. |
| `get_cashea_collection_status(p_business_id, p_from date default null, p_to date default null)` | Con acceso | Para el indicador de REQ-010. Devuelve por `sale_date`: `sale_date`, `orders_count` y `collected_count`, contando solo órdenes no anuladas y omitiendo las fechas sin órdenes. Es estado vivo: se calcula en cada consulta desde `cashea_orders` y no se guarda en `cash_closes` (D-12). |
| `get_cash_close_summary(p_business_id, p_date)` | Con acceso | Se amplía con `cashea_receivable_usd` (suma de `financed_usd`) y `cashea_receivable_ves` (suma de `round(financed_usd * exchange_rate, 2)`) de las órdenes no anuladas con `sale_date = p_date`; `net_usd`/`net_ves` (Total producido) pasan a restar esos montos. Al cambiar el tipo de retorno hay que hacer `drop` de `public.*` y de `private.*` y recrearlas con sus `revoke`/`grant`, y actualizar `private.generate_daily_cash_close` para guardar las columnas nuevas, también en su `on conflict ... do update`. `private.get_dashboard_daily_metrics` consume esta función por nombre de columna dentro de plpgsql: no impide el `drop` y su Total producido hereda el descuento sin tocarla. |

Reglas comunes, tomadas de las migraciones actuales:

- Cada RPC es una función `private.*` (`security definer`, `set search_path = ''`, nombres de esquema completos) y un wrapper `public.*` (`language sql`, `security invoker`).
- Escritura: empieza con `perform private.require_business_write_access(p_business_id)`. Las de Administrador añaden `if not private.is_admin() then raise exception 'Solo un administrador puede ...'`, como `private.edit_product`.
- Lectura: `if not private.has_business_access(p_business_id) then raise exception 'Negocio inexistente, inactivo o no autorizado'`, como `private.get_cash_close_summary`.
- Permisos: `revoke all` de `private.*` a `public, anon, authenticated, service_role` y de `public.*` a `public, anon`; después `grant execute` de ambas a `authenticated, service_role`. Sin el `revoke`, una función nueva queda ejecutable por `anon`.
- Fechas «de hoy» con `(now() at time zone 'America/Caracas')::date`, nunca `current_date`.

**Por qué una función nueva y no un cuarto parámetro en `create_sale`:** cambiar la firma obliga a hacer `drop` de la función de tres parámetros (si quedaran las dos sobrecargas, la llamada con tres argumentos podría resultar ambigua), a rehacer sus permisos y a editar `supabase/tests/atomic_multi_line_sales.test.sql`, que la nombra por su firma `(uuid,jsonb,numeric)`. Componer deja intacto el camino de la venta normal y permite desplegar la migración antes que el frontend.

Patrón de referencia para migraciones, `grant` y `revoke`: `20260808062414_count_billed_operations_in_cash_closes.sql` y `20260809213059_dashboard_daily_produced_metrics.sql` (este último muestra el `drop` y recreación por cambio de tipo de retorno). Regenerar `src/types/supabase.ts` después de aplicar las migraciones: no hay script en `package.json`; con Supabase local en marcha, `npx supabase gen types typescript --local > src/types/supabase.ts`, y pasar `npm run format`.

### 7.3 Frontend

Respetar `AGENTS.md`: servicios como única vía a Supabase, hooks de React Query con fábricas de claves e invalidación en `onSuccess`, formateadores `formatCurrencyUSD`/`formatCurrencyVES`, rutas delgadas, pruebas junto al código, sin `useMemo`/`useCallback` innecesarios (React Compiler).

**Rol en la interfaz:** la capa de permisos de `spec/spec-process-implementacion-rbac.md` (`src/features/auth/permissions/`) aún no existe en el código. Seguir el patrón vigente, `useAuthStore((state) => state.user?.role === "admin")`, como en `src/features/inventory/page.tsx`; no crear la capa dentro de este módulo. La autoridad es la base de datos (REQ-009).

**Claves de consulta:** `casheaKeys` vive en `src/features/cashea/hooks/useCasheaQueries.ts` con la forma de `cashCloseKeys` (`all`, `business(businessId)` y derivadas). Invalidación en `onSuccess`:

- `useCreateSale` añade `casheaKeys.business(businessId)` a las que ya invalida.
- Las mutaciones Cashea (depósito, reversión, anulación, ajuste) invalidan `casheaKeys.business`, `cashCloseKeys.summaries`, `dashboardKeys.business` y `transactionKeys.business`.
- Las mutaciones usan `activeBusinessMutationOptions`, como `useCreateSale`.

| Área | Archivos | Cambio |
|------|----------|--------|
| Servicio | `src/services/casheaService.ts` (nuevo) | Lecturas y RPC de las secciones 7.1 y 7.2. `transactionsService.createSale` llama a `create_cashea_sale` cuando el payload trae `p_cashea` y a `create_sale` en caso contrario |
| Tipos | `src/types/index.ts` | `CasheaOrder`, `CasheaDeposit`, `CasheaOrderStatus`; añadir `p_cashea?` a `ProcessSalePayload`; ampliar `CashCloseSummary` (y `EMPTY_CASH_CLOSE_SUMMARY` en `cash-closes/page.tsx`) con `casheaReceivableUsd` y `casheaReceivableVes` |
| Registrar venta | `src/components/modals/out-modal/` | Componente de campos Cashea con área de pegado (formulario con `useAppForm`); extender `index.tsx` (estado Cashea, limpieza al cerrar y condición del atajo Shift + Enter), `hooks/use-submit-sale.ts`, `components/confirm-sale-dialog.tsx`, `components/sales-summary-block.tsx` y `types/index.ts` |
| Parser | `src/features/cashea/parse-cashea-summary.ts` (nuevo) + `.test.ts` | Función pura (sección 7.4) |
| Página | `src/features/cashea/` (nuevo: `page.tsx`, `columns.tsx`, `hooks/`, `components/`) y `src/routes/_app/cashea.tsx` | Lista, filtros por parámetros de búsqueda, diálogos de cobro, anulación y ajuste |
| Navegación | `src/components/layout/app-sidebar.tsx` | Nuevo ítem; regenerar rutas con `npm run generate-routes` (no editar `routeTree.gen.ts` a mano) |
| Ajustes | `src/features/settings/page.tsx` + `components/cashea-settings-section.tsx` (nuevo) | Sección visible solo para Administrador |
| Cierre de caja | `src/features/cash-closes/components/metrics-summary.tsx`, `cash-close-modal.tsx`, `src/services/cashClosesService.ts`, `src/types/index.ts` | Mostrar «Por cobrar Cashea» como descuento junto a «Crédito Devolución»; el Total producido pasa a venir descontado. **Ambos componentes hoy muestran el bloque de descuentos y el Total producido solo si `hasReturns`**: la condición pasa a ser «hay devoluciones o hay Por cobrar Cashea», y las celdas de devoluciones se muestran solo si hay devoluciones. Los importes de la tabla de cierres (`columns.tsx`) no cambian: `total_usd`/`total_ves` ya guardan el Total producido |
| Indicador en cierres (REQ-010) | `src/features/cash-closes/columns.tsx`, `page.tsx`, `components/cashea-status-indicator.tsx` (nuevo) + `.test.tsx`, `src/features/cashea/hooks/useCasheaQueries.ts`, `src/services/casheaService.ts`, `src/assets/` (logo) | Columna angosta (`columnHelper.display`, sin ordenamiento). Un hook llama a `get_cashea_collection_status`; `page.tsx` une el resultado por `date` a las filas de cierres antes de pasarlas a la tabla, de modo que `columns` sigue siendo estático. La lista de cierres no pagina (`cashClosesService.getAll` trae todos, o uno si hay filtro de fecha): la RPC se llama sin rango, o con `p_from = p_to = date` cuando hay filtro. Logo: una sola imagen con fondo transparente (SVG o PNG) que aporta Anderson; el estado gris se logra con CSS (`grayscale` y opacidad reducida), sin segundo archivo. Palomita: icono de `lucide-react` con el color `text-success` del tema. Revisar el contraste en modo claro y oscuro |
| Ventas | `src/features/transactions/` (`sales-display.ts`, `components/sales-summary.tsx`, `columns.tsx`, `page.tsx`) y `src/services/transactionsService.ts` | La tabla lista renglones, no ventas: la marca Cashea es una insignia junto al código en cada renglón de la venta, como `ExchangeBadge`, con el número de orden en `title`. Los datos llegan en la misma consulta, ampliando `TRANSACTION_SELECT` con el embebido `sales(cashea_orders(order_number, financed_usd, exchange_rate, status))` y el tipo `TransactionWithRelations`. PostgREST puede devolver `cashea_orders` como objeto o como arreglo según detecte la relación: confirmar con los tipos generados. El resumen de la página es siempre «Ventas de hoy» (`useTodayTransactions`), no el de la fecha filtrada: `getSalesSummary` resta lo financiado no anulado una sola vez por venta (ya recorre `sale_id` sin repetir) y devuelve el Por cobrar Cashea |
| Dashboard | `src/features/dashboard/page.tsx`, `components/dashboard-metric-card.tsx`, `src/services/dashboardService.ts` | Tarjeta de saldo por cobrar. La tarjeta «Total producido» no cambia: `get_dashboard_daily_metrics` toma `net_usd` del resumen del cierre y ya llega descontada |
| Datos de prueba | `supabase/seed.sql` | Algunas órdenes Cashea (pendientes y cobradas) en ambos negocios |
| Dominio | `CONTEXT.md`, `docs/adr/` | Sección 5 |

### 7.4 Parser de «Pegar resumen»

Función pura `parseCasheaSummary(text: string): CasheaParseResult`. **Nunca lanza excepciones**: ante texto vacío o irreconocible devuelve todos los campos en `null`. **Lo que no se reconoce se ignora**: el campo queda en `null`, sin avisos ni códigos de error (evita sobreingeniería) y el cajero lo completa a mano.

```ts
type CasheaParseResult = {
  orderNumber: string | null;
  totalUsd: number | null;
  paidTodayUsd: number | null;
  financedUsd: number | null;
  invoiceNumber: string | null;
};
```

Algoritmo:

1. **Normalizar:** unificar saltos de línea, tabulaciones y espacios (incluido el espacio de no separación), recortar.
2. **Etiquetas por campo** (sin distinguir mayúsculas ni acentos, con o sin «:» y «#»): número de orden («# Orden», «N° de orden», «Orden»), total («Monto Total», «Total»), cobrado hoy («Cobrar hoy», «Cobrado hoy», «Pago inicial»), financiado («Financiado») y factura («# de factura», «Factura», «ID»). Las etiquetas se buscan como palabras completas y de la más larga a la más corta: «ID» no debe coincidir dentro de otra palabra, ni «Total» ganarle a «Monto Total».
3. **Valor de cada etiqueta:** primer valor **con la forma del campo** tras la etiqueta, ya esté en la misma línea, separado por tabulación o en la siguiente línea no vacía; sin importar el orden de los bloques. Formas: número de orden, solo dígitos; factura, letras, dígitos y guiones con al menos un dígito; montos, la regla del paso 4. Si lo que sigue a la etiqueta no tiene esa forma, se prueba la siguiente aparición de la etiqueta; si ninguna sirve, el campo queda en `null`. Así «Estado de la orden: En Progreso» no se toma como número de orden.
4. **Montos:** aceptar `$ 185.6`, `$92.80`, `92,80`, `1.234,56` y `1,234.56`. Regla: si hay coma y punto, el último separador es el decimal; si hay un solo separador y le siguen uno o dos dígitos, es decimal; si le siguen exactamente tres, es de miles. Redondear a 2 decimales. Un monto negativo o igual a cero se ignora.
5. **Derivación:** si hay total y pago inicial pero no financiado, `financedUsd = totalUsd - paidTodayUsd`, solo si el resultado es mayor que cero. No usar la suma de las cuotas del historial (puede redondear centavos).
6. **Datos personales:** el parser ignora cualquier otra línea (nombre, cédula) y no las devuelve.

No hay respaldo sin etiquetas. Deducir los montos por aritmética (buscar `a + b = c` entre los números del texto) no puede distinguir cobrado hoy de financiado, y un intercambio pasaría la validación de la suma sin que nadie lo note. Sin etiqueta, el campo queda vacío.

El parser devuelve lo leído tal cual: no valida la aritmética ni emite avisos. Esa validación (cobrado hoy + financiado contra el total, campos obligatorios) vive en el formulario (REQ-001).

UI: mostrar lo reconocido en los campos editables, dejar vacíos los no reconocidos y exigir la confirmación del cajero. Nunca guardar sin confirmación.

Casos de prueba mínimos (fixtures de `parse-cashea-summary.test.ts`):

| Caso | Entrada (resumida) | Resultado esperado |
|------|--------------------|--------------------|
| A. Resumen «Debe pagar», etiqueta y valor en líneas separadas | `# Orden / 6400685 / Total / $ 185.6 / Cobrar hoy / $ 92.80 / Financiado / $ 92.80 / ID / 551-000738` | orden `6400685`, total 185.60, hoy 92.80, financiado 92.80, factura `551-000738` |
| B. Igual, separado por tabulaciones | `# Orden\t6400685\nTotal\t$ 185.6 ...` | Igual que A |
| C. Todo en una sola línea | `Debe pagar # Orden 6400685 Total $ 185.6 Cobrar hoy $ 92.80 Financiado $ 92.80 ID 551-000738` | Igual que A |
| D. Coma decimal | `Total 185,60 Cobrar hoy 92,80 Financiado 92,80` | 185.60 / 92.80 / 92.80 |
| E. Detalle de orden | `Monto Total: $92.80 ... Pago inicial ... $ 46.40 ... Segundo pago ... $ 15.47` | total 92.80, hoy 46.40, financiado 46.40 (derivado: total menos pago inicial) |
| F. No cuadra | `Total $ 100 Cobrar hoy $ 40 Financiado $ 50` | valores leídos tal cual; el formulario (REQ-001) impide confirmar porque la suma no cuadra |
| G. Irreconocible | `hola`, cadena vacía | todo `null`, sin excepción |
| H. Con datos personales | Texto de A con nombre y cédula añadidos | Igual que A; el resultado no contiene datos personales |
| I. Falta un dato | Texto de A sin las líneas `ID` y `551-000738` | orden, total, hoy y financiado reconocidos; `invoiceNumber` en `null`, sin avisos; el formulario exige completarlo |
| J. Etiqueta con valor de otra forma | Texto de E con «Estado de la orden: En Progreso» antes de «# Orden 6400685» | orden `6400685`; «En Progreso» no se toma como número de orden |
| K. Separador de miles | `Total $ 1,234.50` y `Total 1.234,50` | 1234.50 en ambos |
| L. Montos sin etiquetas | `185.60 92.80 92.80` | todo `null`: no se deducen montos por aritmética |

Añadir cada texto real que se obtenga del panel como un caso nuevo.

### 7.5 Cálculos

```
service_fee  = round(total_usd    × service_fee_pct  / 100, 2)   // sobre el total de la venta Cashea
advance_fee  = round(financed_usd × advance_fee_pct  / 100, 2)   // sobre lo financiado
expected_net = financed_usd − service_fee − advance_fee

deposit.expected_net_usd = Σ expected_net de las órdenes incluidas
deposit.implied_rate     = received_ves / deposit.expected_net_usd                  // null si expected_net_usd ≤ 0
deposit.difference_usd   = deposit.expected_net_usd − round(received_ves / applied_rate, 2)   // solo si hay applied_rate

cierre.cashea_receivable_usd = Σ financed_usd                              // órdenes no anuladas del día
cierre.cashea_receivable_ves = Σ round(financed_usd × exchange_rate, 2)    // tasa de cada venta
cierre.net_usd = total_usd − total_returns_usd − cashea_receivable_usd
cierre.net_ves = total_ves − total_returns_ves − cashea_receivable_ves
```

Todos los cálculos se hacen en la base de datos con `numeric`. El frontend solo los repite para la vista previa del diálogo de cobro; el valor guardado es el de la RPC.

Ejemplos: total $200 y financiado $100 con 4% y 4% dan comisiones $8.00 y $4.00, neto esperado $88.00. Total $185.60 y
financiado $92.80 dan $7.42 y $3.71, neto esperado $81.67 (cada comisión se redondea a centavos antes de restar).

El 4% «sobre el total de la semana» equivale a sumar el 4% de cada orden salvo diferencias de redondeo de centavos; por
eso la tolerancia de $0.05 por depósito del REQ-006.

## 8. Plan por etapas

El compromiso con el cliente es entregar en dos etapas, en un plazo de 5 a 7 días hábiles desde el pago inicial.

| Etapa | Contenido | Entregable verificable |
|-------|-----------|------------------------|
| 1 | Migración de datos (`cashea_orders` sin las columnas de la Etapa 2, columnas de comisiones en `app_settings`, `create_cashea_sale`, `update_cashea_settings`, `get_cash_close_summary` y `generate_daily_cash_close` ampliadas); parser con pruebas; OutModal con campos y pegado; Ajustes de comisiones (REQ-003); cierre de caja (REQ-004); marca Cashea en ventas | Registrar una venta Cashea y ver el cierre separado en ambos negocios |
| 2 | `cashea_deposits`, `cashea_order_adjustments` y las columnas de cobro y anulación en `cashea_orders`; RPC de depósito, reversión, anulación, ajuste, resumen y estado de cobro; página Cashea; tarjeta del dashboard; indicador Cashea en la tabla de cierres (REQ-010) | Cobrar un lote de órdenes en bolívares, ver la diferencia y la tasa implícita, y ver los días de la tabla de cierres pasar de logo gris a logo a color con palomita |

Orden sugerido dentro de cada etapa: migración y pruebas SQL, tipos regenerados, servicio y hooks, interfaz, pruebas de
frontend, datos de prueba y verificación manual. Cada etapa despliega primero la migración y después el frontend: las
migraciones solo añaden (columnas nullable o con valor por defecto, funciones nuevas, columnas extra en un retorno), así
que el frontend ya desplegado sigue funcionando entre un paso y otro.

### 8.1 Antes de empezar

Ninguno de estos pasos bloquea el inicio; reducen retrabajo.

1. **Pedir al cliente una muestra real.** El texto copiado del resumen «Debe pagar» de una orden y, si existe, el detalle de un depósito ya recibido (Q-01 a Q-03). Hoy el parser y la fórmula de comisiones se apoyan en un tutorial de 2024. Si la muestra no llega a tiempo, se construye igual: el ingreso manual no depende del parser y los porcentajes son editables.
2. **Confirmar los puntos que cambian el alcance:** Q-04 (¿ambos negocios?) y Q-11 (venta registrada sin marcar Cashea).
3. **Dejar escrito el lenguaje:** actualizar `CONTEXT.md` y crear el ADR 0002 (sección 5) antes del primer código, para que nombres de tablas, textos de interfaz y pruebas usen los mismos términos.

## 9. Pruebas

**Base de datos (pgTAP, `supabase/tests/`):** crear `cashea_orders.test.sql` y `cashea_deposits.test.sql`, y ampliar `multi_business_isolation.test.sql` (actualizar su `plan(n)`).

- Unicidad de `order_number` entre órdenes no anuladas del negocio, su repetición permitida entre negocios y su reutilización después de anular.
- `check` de suma (cobrado hoy + financiado = total), de total y financiado positivos y de cobrado hoy no negativo.
- Atomicidad de `create_cashea_sale` (si falla el Cashea, no queda venta ni stock descontado), rechazo de `p_cashea` mal formado y de un financiado mayor que el total de la venta. `create_sale` sigue pasando `atomic_multi_line_sales.test.sql` sin cambios.
- Empleado: puede crear venta Cashea y leer órdenes y porcentajes; no puede cobrar, revertir, anular, ajustar ni cambiar comisiones, ni por RPC ni con `update` directo sobre `app_settings`. Sin sesión (`anon`) no puede ejecutar ninguna función nueva.
- Aislamiento: usuario de un negocio no ve ni toca órdenes o depósitos del otro.
- Depósito: rechaza lista vacía, identificadores repetidos, órdenes anuladas, ya cobradas o de otro negocio, y fecha futura; deja todo sin cambios si una falla; calcula tasa implícita y diferencia; con neto esperado ≤ 0 guarda la tasa implícita en `null`.
- Reversión: devuelve las órdenes a `pending`, marca el depósito, exige nota y no se puede repetir; tras revertir, las órdenes se pueden cobrar de nuevo.
- Anulación y ajuste: solo desde `pending`; el ajuste registra valores anteriores y nuevos y recalcula el neto esperado con los porcentajes de la orden; la coherencia de estado (`check`) rechaza combinaciones inválidas.
- `get_cashea_collection_status`: cuenta solo órdenes no anuladas por fecha de venta; un día con una orden Cobrada y otra Pendiente devuelve `orders_count` 2 y `collected_count` 1; cobrar la última deja ambos en 2; anular la Pendiente también; un día solo con órdenes anuladas no aparece; un usuario de un negocio no ve fechas del otro; el empleado puede leerlo.
- Cierre de caja: con la venta de ejemplo de REQ-004 devuelve Total facturado $185.60, Por cobrar Cashea $92.80 y Total producido $92.80; `generate_daily_cash_close` guarda ese Total producido en `total_usd`/`total_ves` y el desglose en las columnas nuevas, también al cerrar por segunda vez el mismo día; el equivalente en Bs. usa la tasa de la venta; los cierres previos conservan `null` en las columnas nuevas y no cambian; una orden anulada deja de contar en días aún abiertos. `billed_operations_cash_closes.test.sql` sigue pasando.
- Los porcentajes copiados en la orden no cambian cuando se modifican los de Ajustes.

**Frontend (Vitest):** parser (fixtures A–L), formulario Cashea (los cinco datos obligatorios, suma calculada y validada contra el total, advertencia de total distinto, bloqueo por financiado mayor que la venta, bloqueo de confirmación, segundo pegado que no vacía campos), hook de envío de venta con `p_cashea` (llama a `create_cashea_sale`; sin él, a `create_sale`), `MetricsSummary` y `CashCloseModal` con Cashea y sin devoluciones (deben mostrar Por cobrar Cashea y Total producido), `getSalesSummary` descontando lo financiado una vez por venta y sin contar anuladas (ampliar `sales-display.test.ts`), columnas de ventas con marca Cashea, diálogo de cobro (neto esperado, tasa implícita, diferencia), `CasheaStatusIndicator` (sin órdenes: vacío; con pendientes o mezcla: logo gris y `aria-label` con el conteo; todas cobradas: logo a color con palomita; órdenes anuladas ignoradas), columna del indicador en la tabla de cierres y visibilidad por rol.

**Aceptación manual con una orden real:** con la primera orden Cashea de la tienda, pegar el resumen real y comprobar el reconocimiento de campos; con el primer depósito, comprobar la base de cálculo de las comisiones y la tasa aplicada. Ajustar parser y fórmulas con lo observado.

## 10. Riesgos y preguntas abiertas

| # | Tema | Acción |
|---|------|--------|
| Q-01 | Formato real del texto copiado del panel (nombres y orden de campos) | Aceptación manual con la primera orden real; añadir fixtures |
| Q-02 | Base del 4% de servicio: ¿total de las ventas Cashea de la semana o monto financiado? ¿Cashea cobra IVA sobre sus comisiones? | Verificar con el primer depósito; si difiere, ajustar la fórmula de 7.5. Mientras tanto, la diferencia aparece en «comisiones y ajustes» |
| Q-03 | Tasa en bolívares que aplica Cashea (inicio de semana, día de pago o fija a inicio de mes) | Usar la tasa implícita de los primeros depósitos para deducir la regla |
| Q-04 | ¿Cashea aplica a ambos negocios o a uno solo? | Si es a uno, valorar una bandera por negocio que oculte la interfaz Cashea en el otro |
| Q-05 | ¿Los porcentajes difieren entre negocios? | El diseño ya es por negocio |
| Q-06 | Políticas RLS y permisos actuales de `app_settings` | **Resuelta** (7.1): lectura para todo usuario con acceso al negocio; las columnas nuevas no son actualizables desde el cliente |
| Q-07 | Devoluciones de ventas Cashea | Fuera de alcance; requeriría ligar devoluciones a la venta original. Riesgo conocido: la devolución resta del Total producido el crédito completo el día en que se registra, aunque la venta Cashea solo dejó en caja lo cobrado hoy. Hasta que se diseñe, el Administrador compensa a mano (anulación o ajuste con nota) |
| Q-08 | Si el depósito pudiera llegar en dólares | Hoy se asume siempre en bolívares |
| Q-09 | Corte semanal (qué órdenes entran en cada depósito) | El Administrador las selecciona a mano; un reporte de Cashea con los números de orden simplificaría la conciliación |
| Q-10 | Uso del logo de Cashea (marca de un tercero) dentro de la interfaz interna | Se asume uso interno para identificar el método de venta; confirmar si Cashea publica lineamientos de marca antes de producción |
| Q-11 | Venta registrada sin marcar «Pago con Cashea» (olvido del cajero) | Hoy no tiene corrección: la Orden Cashea solo nace junto con la venta, y el cierre de ese día contaría lo financiado como dinero en caja. Opción recomendada, **no incluida en el alcance**: que el Administrador pueda asociar una Orden Cashea a una venta existente del día en curso, reutilizando la inserción de `create_cashea_sale`. Decidir con el cliente |
| Q-12 | Orden anulada o ajustada después de que su día fue cerrado | El cierre guardado no cambia (D-06) y queda con el Por cobrar Cashea original; el resumen en vivo y el indicador muestran el estado actual (REQ-007). Se acepta la diferencia; la nota obligatoria la explica |
| Q-13 | Base de datos de producción | Este diseño se verificó contra las migraciones del repositorio y `src/types/supabase.ts`, que coinciden entre sí. No se verificó contra la base remota: antes de aplicar, confirmar que no tiene cambios fuera de las migraciones (`npx supabase db diff --linked`) |

## 11. Alcance acordado con el cliente (resumen)

Incluye: venta con Cashea (número de orden, total de la orden, cobrado hoy, financiado y número de factura), pegar resumen, cierre de caja con
separación e indicador del depósito Cashea por día en la tabla de cierres, configuración de comisiones por negocio con neto esperado, cuentas por cobrar con cobro individual, cobro por
depósito en bolívares con tasa implícita y diferencia, reversión de un depósito mal registrado, anulación y ajuste con nota (montos, número de orden y número de factura), filtros y antigüedad, tarjeta de
saldo en el dashboard, pruebas, aislamiento entre negocios y despliegue. Soporte de 14 días.

No incluye: integración automática con Cashea o su panel, registro automático de devoluciones de ventas Cashea, método de
pago del cliente, conciliación bancaria automática, exportaciones a PDF o Excel, comparaciones entre negocios ni cambios a
los flujos actuales distintos a los descritos. El cliente debe facilitar el resumen real de órdenes de Cashea para
verificar el reconocimiento de datos y el primer depósito para verificar comisiones y tasa; si esos criterios difieren de
lo descrito, los ajustes se tratan aparte.

## 12. Referencias en el repositorio

- `CONTEXT.md` (glosario), `PRODUCT.md`, `AGENTS.md`, `docs/adr/0001-ventas-con-identidad-sin-reconstruir-el-historico.md`.
- `supabase/migrations/20260808052019_create_atomic_multi_line_sales.sql` (tabla `sales`, `create_sale`, RLS y grants).
- `supabase/migrations/20260808062414_count_billed_operations_in_cash_closes.sql` (resumen y generación del cierre).
- `supabase/migrations/20260809213059_dashboard_daily_produced_metrics.sql` (el dashboard diario toma el Total producido del resumen del cierre).
- `supabase/migrations/20260622153214_migrate_to_multi_business.sql` (helpers `private.has_business_access`, `private.can_write_business`, `private.require_business_write_access`, `private.is_admin`; `process_return`).
- `supabase/tests/multi_business_isolation.test.sql` y `supabase/seed.sql`.
- `src/components/modals/out-modal/`, `src/features/cash-closes/`, `src/features/settings/`, `src/features/dashboard/`, `src/features/transactions/`, `src/services/`.
