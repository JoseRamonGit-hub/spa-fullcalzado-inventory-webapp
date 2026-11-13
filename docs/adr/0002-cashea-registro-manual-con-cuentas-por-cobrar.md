# Cashea: registro manual con cuentas por cobrar

Las Ventas Cashea se registran manualmente en Full Calzado, con ayuda del pegado del resumen de la orden y con ingreso manual siempre disponible, porque no hay integración ni acceso al panel de Cashea. Cada Venta Cashea guarda su Orden Cashea, y su Monto financiado queda como Cuenta por cobrar Cashea hasta que el Administrador registra el Depósito Cashea que la cubre.

El Total producido conserva su nombre y su significado, la cifra real resultante en caja, y pasa a descontar lo financiado: el cierre de caja lo muestra como «Por cobrar Cashea». El Total facturado no cambia, así que el Ticket promedio y los períodos del dashboard siguen igual. Los cierres ya generados no se recalculan, coherente con ADR 0001.

Cuando una Venta Cashea se devuelve en un día posterior al de su venta, la Devolución resta el crédito completo aunque de caja solo salió lo Cobrado hoy. Se compensa en el cierre del día de la anulación, que suma el Monto financiado como «Cashea anulado por devolución». Las devoluciones no se ligan a la venta original: basta con anular la Orden Cashea con el motivo «Devolución del cliente».

## Alternativas rechazadas

- **Restar lo financiado del Total facturado.** Alteraría el Ticket promedio y las cifras por período del dashboard, que trabajan con Total facturado, y mezclaría lo vendido con lo cobrado.
- **Añadir una cifra nueva para el dinero en caja.** El Total producido ya significa «cifra real resultante en caja»; una segunda cifra con el mismo propósito obligaría a explicar cuál de las dos usar y duplicaría el lenguaje.
