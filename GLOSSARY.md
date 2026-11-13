# Gestión de inventario y ventas

Este contexto describe el lenguaje de negocio compartido por la operación de las zapaterías. Cada dato operativo pertenece a un negocio y se consulta dentro del negocio activo.

## Negocios

**Negocio activo**:
Negocio seleccionado por el usuario y única frontera para consultar ventas, inventario, movimientos y métricas.

## Catálogo e inventario

**Producto**:
Artículo inventariable identificado por un código dentro de un negocio, con descripción, existencias, precio y estado. La descripción puede contener el modelo que el negocio considere necesario.
_Avoid_: Zapato, modelo, variante

**Producto inactivo**:
Producto retirado del reabastecimiento que puede venderse hasta agotar sus existencias y continúa aceptando devoluciones.

**Stock disponible**:
Suma de las existencias actuales de todos los Productos que aún tienen unidades, incluidos los Productos inactivos en liquidación.

**Stock bajo**:
Condición de reposición de un Producto activo cuyas existencias actuales son iguales o inferiores a tres unidades, incluido cero. Los Productos inactivos no generan esta alerta.
_Avoid_: Stock mínimo, mínimo por producto

**Producto estancado**:
Producto activo o inactivo con existencias positivas y sin salidas comerciales mediante una Venta o un Cambio durante treinta días completos. Las entradas, los ajustes y las devoluciones no reinician el período; si nunca tuvo una salida comercial, se cuenta desde su primera existencia positiva.
_Avoid_: Producto sin movimiento

**Historial de producto**:
Secuencia cronológica de eventos auditados de un Producto: entradas, Ventas, devoluciones, salidas por Cambio, ajustes, activaciones y desactivaciones. Cada evento identifica cuándo ocurrió y quién fue responsable.

**Última actividad**:
Evento auditado más reciente del Historial de producto, aunque no haya modificado sus existencias.
_Avoid_: Último movimiento

## Ventas

**Venta**:
Operación de caja confirmada como una unidad, compuesta por uno o más Renglones de venta.
_Avoid_: Transacción, fila de venta, producto vendido

**Renglón de venta**:
Parte de una Venta que registra un Producto, su cantidad y los importes aplicados a ese producto.
_Avoid_: Venta, operación, ticket

**Devolución**:
Operación que recibe uno o más Productos entregados previamente y reconoce su valor como crédito. Puede concluir con un reembolso o con un Cambio.

**Cambio**:
Devolución que entrega uno o más Productos de reemplazo y puede generar una diferencia monetaria.

**Operación facturada**:
Venta o Cambio que entrega Productos y aporta sus importes brutos al Total facturado. Una devolución sin reemplazo no es una Operación facturada.
_Avoid_: Renglón de venta, transacción

**Total facturado**:
Suma bruta de las ventas registradas durante un período, sin descontar devoluciones ni aplicar las diferencias generadas por cambios.
_Avoid_: Ganancia, ingreso neto

**Total producido**:
Cifra real resultante en caja durante un período, después de aplicar al Total facturado los créditos de devoluciones, las diferencias generadas por Cambios, lo que quedó Por cobrar Cashea y el Cashea anulado por devolución.
_Avoid_: Total facturado, ganancia

**Ticket promedio**:
Total facturado de un período dividido entre su cantidad de Operaciones facturadas.
_Avoid_: Promedio por producto, promedio por renglón

## Cashea

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
Monto financiado de una Orden Cashea mientras Cashea no lo haya depositado. Estados: Pendiente, Cobrada, Anulada. El estado indica si Cashea ya depositó esa orden a la tienda y es independiente del estado de la orden en el panel de Cashea.

**Por cobrar Cashea**:
Etiqueta del cierre de caja: suma del Monto financiado de las Órdenes Cashea no anuladas de las Ventas del período, aunque Cashea las deposite después. Se descuenta del Total producido. También cuenta la orden anulada por «Devolución del cliente» en un día posterior al de su venta: su compensación se registra el día de la anulación (Cashea anulado por devolución).

**Cashea anulado por devolución**:
Etiqueta del cierre de caja: suma del Monto financiado de las Órdenes Cashea anuladas ese día con el motivo «Devolución del cliente» cuya Venta es de un día anterior. Se suma al Total producido para compensar que la Devolución resta el crédito completo aunque de caja solo salió lo Cobrado hoy.

**Depósito Cashea**:
Pago agrupado que Cashea hace a la tienda, en bolívares y neto de comisiones, por una o varias Órdenes Cashea.
_Avoid_: Lote, liquidación

**Comisión Cashea**:
Suma del servicio (porcentaje sobre el total de la Venta Cashea) y la tarifa de adelanto (porcentaje sobre el Monto financiado), definidos por negocio.

**Neto esperado**:
Monto financiado menos la Comisión Cashea de una orden, en dólares.

**Tasa implícita**:
Bolívares recibidos en un Depósito Cashea entre el Neto esperado de sus órdenes. Sirve para descubrir qué tasa aplica Cashea.
