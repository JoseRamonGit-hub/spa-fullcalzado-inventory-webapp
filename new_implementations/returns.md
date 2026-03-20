Lo definido aqui, solo es un borrador, no refleja la implementacion final.

**Contexto del Sistema:**

- Base de datos en PostgreSQL (Supabase).
- Existe una tabla `transactions` (ventas) que genera salidas de inventario vía triggers.
- Existe una tabla `inventory_movements` (entradas/salidas).
- Existe una función `generate_daily_cash_close` que suma el total de las transacciones del día.
- Política de la tienda: NO hay devoluciones de dinero en efectivo/transferencia. Todo saldo a favor debe consumirse en nuevos productos en el mismo momento. Se permite flexibilidad excepcional si el saldo a favor es mayor al producto que se lleva, pero el sistema debe soportarlo sin romper el cierre de caja. En un caso super excepcional, el sistema debe permitir la devolucion del o los productos, sin consumir nuevos productos, asumiendo que el cliente devuelve producto y el comercio devuelve el dinero.

**Escenarios de Casos de Uso a soportar:**

1. Cambio exacto: Cliente devuelve producto de $5, se lleva otro de $5. Diferencia a pagar: $0. Inventario: +1 producto devuelto, -1 producto nuevo.
2. Upsell: Cliente devuelve producto de $5, se lleva uno de $11. Diferencia a pagar: $6.
3. Multi-producto: Cliente devuelve producto de $10, se lleva 5 productos distintos de $5 c/u. Diferencia a pagar: $15. (Entra 1 producto, salen 5).

**Requerimientos a resolver (Backend y DB):**

1. Propuesta de Esquema (Migrations): ¿Cómo estructurar esto en la DB? ¿Debo crear una tabla `returns` que agrupe las transacciones de entrada y salida?
2. Actualización de Enums: Necesito agregar un tipo `return` a `movement_types` para diferenciarlo de un `entry`.
3. Corrección del Cierre de Caja: Modificar la función `generate_daily_cash_close` para que contemple el valor a favor de las devoluciones, de modo que la caja cuadre solo con el dinero real (la "diferencia") que entregó el cliente, y no sobreestime los ingresos.
4. Lógica transaccional (Backend/Triggers): ¿Cómo asegurar que al hacer el cambio, se sume el stock del producto devuelto, se reste el de los nuevos, y se generen los movimientos correctos sin romper las restricciones de la base de datos actual? O habria que romper las restricciones?

**Requerimientos a resolver (Frontend y UX/UI):**

1. Explica cómo debe ser el User Flow (Flujo de usuario) del lado del cajero para ejecutar un cambio de manera rápida y sin fricción (¿Un carrito dividido entre retornos y salidas?).
2. Explica cómo visualizar estos cambios en las vistas existentes, específicamente cómo hacer que los retornos se vean claramente en el historial de inventory_movements y cómo reflejar la operación en la tabla histórica de transactions.
3. Explica cómo debe ser el User Flow (Flujo de usuario) del lado del cajero para ejecutar un cambio de manera rápida y sin fricción (¿Un carrito dividido entre retornos y salidas?).
4. Restricción de Vistas: Actualmente tengo 4 vistas (Productos, Movimientos, Ventas, Cierres). NO quiero crear una 5ta vista.
