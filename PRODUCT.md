# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El producto prioriza por igual a dos perfiles internos de las zapaterías:

- **Empleado:** opera durante la jornada, registra entradas, ventas, devoluciones y cambios, y consulta inventario y movimientos dentro de los negocios que tiene asignados.
- **Administrador:** supervisa la operación, cambia entre negocios autorizados, consulta métricas y cierres, mantiene productos, tasas de cambio, usuarios y accesos.

## Product Purpose

Centralizar la operación diaria de varias zapaterías en una sola aplicación. El producto conecta inventario, ventas, devoluciones, cambios, movimientos, cierres de caja y métricas para que empleados y administradores trabajen con datos consistentes del negocio activo.

El éxito significa que el equipo pueda ejecutar y supervisar la jornada con rapidez, conservar existencias e importes correctos, identificar responsables y consultar cada negocio sin mezclar su información con la de otro.

## Positioning

Una misma operación integrada para varias zapaterías, con el negocio activo como frontera visible y con aislamiento de datos por negocio aplicado también en PostgreSQL mediante Row-Level Security. Cambiar de negocio no requiere cambiar de aplicación ni cerrar sesión, y las operaciones comerciales actualizan inventario, historial y métricas como partes del mismo sistema.

## Operating Context

- Es una herramienta interna utilizada durante la operación cotidiana de las tiendas, no un escaparate de comercio electrónico para clientes finales.
- La interfaz es responsiva y contempla flujos de escritorio y móvil, incluidos accesos rápidos para entradas, ventas y devoluciones.
- Cada consulta y operación ocurre dentro de un negocio activo. Actualmente están identificados Full Calzado C.A. y Zapatería Estilos C.A.
- La operación usa dólares estadounidenses y bolívares venezolanos, con una tasa de cambio mantenida por negocio.
- Las fechas, horas y formatos corresponden a Venezuela (`es-VE`, `America/Caracas`).

## Capabilities and Constraints

- Autenticación de usuarios y permisos mediante los roles **Administrador** y **Empleado**.
- Acceso a uno o varios negocios autorizados y selección de un negocio activo sin mezclar datos entre negocios.
- Dashboard con indicadores de facturación, operaciones facturadas, unidades vendidas, stock disponible, stock bajo, productos estancados y desempeño por períodos.
- Catálogo e inventario con entradas por lote, edición administrativa, activación o desactivación de productos, búsqueda, alertas e historial auditado por producto.
- Ventas de uno o varios renglones confirmadas como una operación atómica.
- Devoluciones y cambios con reintegro de existencias, crédito reconocido y diferencias monetarias.
- Registro de movimientos de inventario y cierres de caja diarios.
- Administración de usuarios y accesos por negocio reservada al rol Administrador.
- Aplicación SPA en React y TypeScript con Supabase como sistema de autenticación y datos; la capa de servicios es la única vía del frontend hacia Supabase.
- Separación multi-negocio por `business_id`, políticas RLS y validaciones de integridad en PostgreSQL. La selección del frontend no concede permisos por sí sola.
- Interfaz interna en español y soporte de tema claro y oscuro.

## Brand Commitments

- **Full Calzado** es el nombre principal visible en el acceso y Full Calzado C.A. es uno de los negocios operados.
- **Zapatería Estilos C.A.** es el segundo negocio actualmente confirmado.
- La voz del producto es directa, operativa y profesional, con terminología específica del dominio en español.
- El vocabulario canónico del negocio está definido en `CONTEXT.md`; futuras interfaces deben preferir esos términos y evitar los sinónimos allí desaconsejados.

## Evidence on Hand

- Aplicación funcional y pruebas del producto en `src/` y `supabase/tests/`.
- Modelo y vocabulario del dominio en `CONTEXT.md`.
- Decisiones de arquitectura y operación multi-negocio en `spec/` y `docs/adr/`.
- Fotografía de calzado utilizada en el acceso en `src/assets/calzado.jpg`.
- Iconos y manifiesto de aplicación web en `public/`.
- No hay testimonios, estudios de caso, cifras comerciales, clientes externos ni reconocimientos públicos confirmados; futuras piezas no deben inventarlos.

## Product Principles

1. **Un negocio activo, un contexto inequívoco.** Toda pantalla, consulta y operación debe dejar claro a qué negocio pertenece y evitar cruces accidentales.
2. **Operar y supervisar con la misma prioridad.** Los flujos frecuentes del empleado y la visibilidad administrativa son igualmente esenciales.
3. **Una operación, una historia coherente.** Ventas, devoluciones, cambios y entradas deben mantener sincronizados inventario, importes, responsables y auditoría.
4. **Velocidad sin sacrificar control.** La interacción debe ser ágil durante la jornada y conservar validaciones, permisos y confirmaciones proporcionales al riesgo.
5. **Hablar como habla el negocio.** La interfaz debe usar el vocabulario canónico y los formatos venezolanos de manera consistente.
