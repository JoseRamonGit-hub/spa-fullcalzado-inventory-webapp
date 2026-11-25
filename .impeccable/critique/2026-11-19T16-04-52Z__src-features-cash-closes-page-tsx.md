---
target: Cierres de Caja
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-11-19T16-04-52Z
slug: src-features-cash-closes-page-tsx
---
Método de doble evaluación (/root/design_review y /root/detector).

# Cierres de Caja

**23/40 en la revisión heurística de Nielsen.** La vista ya tiene una estructura adecuada para una zapatería. El principal problema se produce al decidir si actualizar un cierre: los $129.00 de hoy, los $107.00 guardados y los +$22.00 de diferencia están en tres lugares. La decisión debería poder tomarse en un solo bloque, con la fecha y la hora del cierre guardado y acceso a los movimientos que explican el cambio.

## Evaluación heurística

| Criterio | Puntos sobre 4 | Evidencia |
|---|---:|---|
| Visibilidad del estado | 2 | El cambio se anuncia, pero la cifra actual y la guardada están separadas. |
| Correspondencia con la operación | 2 | El cuadre usa conceptos del negocio. El significado temporal de «Por cobrar a Cashea» y «Cobro Cashea» se confunde. |
| Control | 3 | Hay cancelación, detalle bajo demanda y forma de limpiar el filtro. Su alcance es ambiguo. |
| Consistencia | 3 | Buen uso de alineación y densidad. Enlaces, filas y expansores tienen señales visuales dispares. |
| Prevención de errores | 2 | Hay confirmación. Una falla de lectura puede interpretarse como día sin cierre. |
| Reconocimiento | 2 | Hay que encontrar la fila de hoy y relacionarla con el importe y el aviso. |
| Eficiencia | 3 | Filas compactas, acceso al detalle y ordenamiento. Expandir desplaza la acción primaria. |
| Diseño minimalista | 2 | El lateral crece con el desglose y gran parte queda vacío. |
| Recuperación | 2 | Existen reintentos y mensajes de error. La acción de cierre puede seguir disponible con estado desconocido. |
| Ayuda contextual | 2 | «Ventas» tiene ayuda. Las métricas decisivas y la diferencia entre cierre guardado y cuadre de hoy necesitan contexto visible. |

## Qué funciona

- Las filas reflejan la operación de la tienda. En la captura, ventas, cambios, devoluciones y Cashea permiten seguir la cuenta de $101.00 + $29.00 − $22.00 + $21.00 = $129.00.
- La alineación a la derecha, las cifras tabulares en USD y Bs. y el total con mayor peso ayudan a revisar importes sin perder la fila. La paleta cálida y el bronce reservado para la acción principal encajan con el sistema visual del producto.
- Expandir Cambios y Cashea conserva una lectura rápida por defecto. El historial también ofrece un detalle por fecha que ya incluye los conteos, el responsable y la tasa del cierre.

## Prioridades

1. **P1 · Reunir la comparación y explicar qué se guarda.** En el bloque de hoy mostrar «Cierre guardado · 9:51 a. m.», «Total producido hoy» y «Diferencia desde el cierre» junto a «Actualizar cierre». Etiquetar la fila de hoy como guardada. Dar acceso a los movimientos desde esa hora si puede aplicarse ese alcance con precisión. El diálogo ya permite cancelar, identifica el negocio y muestra el monto previo en USD. Completar el antes y después en ambas monedas y decir que se reemplaza el cierre de ese día. Tras confirmar, mantener visible el nuevo importe guardado y su hora. Mostrar el nombre del negocio junto a la fecha cuando el contexto se reduce a un punto de color.
2. **P1 · Mostrar un estado fiable.** Si falla la consulta del cierre sin datos previos, el historial reporta el error y el panel puede interpretar la ausencia como «Sin cerrar». Mostrar «No pudimos verificar el cierre» y «Reintentar» antes de habilitar el guardado. La comparación de vigencia omite el total en Bs. y seleccionar explícitamente hoy desactiva el refresco periódico del resumen. Mantener el refresco para hoy y comparar ambas monedas. Casos a verificar: error al consultar un cierre existente, diferencia solo en Bs. y operación posterior con total neto sin cambios.
3. **P1 · Aclarar qué cuenta en el total y qué pasó con el cobro.** Los $21.00 de Cashea aportan al total mostrado. Los $40.00 del desglose son el monto financiado de esas órdenes y tienen apariencia de otro sumando. En la versión desglosada, conservar la información como «Monto financiado · fuera del total» y mantener visible el ajuste con signo cuando forme parte del cálculo de respaldo. «Estado de cobro Cashea» puede identificar el estado consultado hoy. Distinguir sin órdenes, cargando y consulta fallida, que ahora pueden verse como el mismo guion. Conservar «Total producido» y «Total facturado» y explicar brevemente su diferencia. Evitar presentar las equivalencias monetarias como saldos físicos por medio de pago.
4. **P2 · Anclar la acción y recuperar altura para el historial.** El lateral separa la advertencia y el botón con un vacío que crece al desplegar el cuadre. Colocar estado, cifras y botón en una banda compacta encima del desglose. Así, abrir Cambios y Cashea solo mueve el contenido que sigue. Reservar el bronce para la acción y el ámbar para el estado que requiere atención. La ampliación de cuatro filas desplaza hoy el botón alrededor de 146 px entre capturas.
5. **P2 · Darle al historial sus propios controles.** «Filtrar por día» parece filtrar la tabla, pero también cambia el cuadre superior. Mantener hoy como contexto principal y colocar el filtro junto a «Historial de cierres» es la opción preferida para buscar registros. Si la intención del selector es consultar toda la página por fecha, llamarlo «Ver fecha» y distinguir «Cuadre recalculado» de «Cierre guardado». Agrupar USD y Bs. debajo de «Total producido». En anchos reducidos, llevar Operaciones, Unidades y Cerrado por al detalle, con la excepción «Sin cierre» siempre visible. Simplificar la paginación cuando caben solo dos páginas.

## Señales y pruebas de tarea

- Para un empleado nuevo, la comprobación es identificar qué se registró y si los $40.00 de Cashea forman parte del total. Los signos y la distinción entre inicial y financiado deben resolverlo sin abrir ayuda.
- Para un supervisor, la comprobación es localizar el importe que va a cambiar y llegar a la operación que lo explica. La confirmación y el estado persistente posterior son los momentos que más afectan la confianza.
- Para una persona que navega por teclado, el historial ya usa Enter y Espacio. Hacer visible la acción de la fila y el foco, y verificar los anuncios de cambio de estado en todos los tamaños. El enlace «3 ventas · 3 unidades» parece texto auxiliar y abre las ventas de la fecha. Darle una señal de enlace y una etiqueta coherente con ese destino.

La prioridad es reducir las búsquedas y comparaciones que el usuario hace de memoria. La tabla, los signos, la densidad y el detalle bajo demanda ya resuelven bien el resto de la tarea.

El detector estático devolvió 0 hallazgos en el módulo. La evaluación visual se basa en las dos capturas de escritorio y la lectura del código.
