---
target: Ver detalle de producto
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-10T13-03-25Z
slug: src-features-product-detail-page-tsx
---
Method: dual-agent (A: critique_visual_terra · B: critique_detector_terra)

## Design Health Score

| # | Heurística | Puntaje | Problema clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3/4 | Estado, actividad, carga y errores son claros; el período no resume qué contiene ni qué merece atención. |
| 2 | Correspondencia con el mundo real | 4/4 | Stock, moneda dual, fechas venezolanas y vocabulario de venta pertenecen a la operación de la tienda. |
| 3 | Control y libertad | 3/4 | Volver, cancelar, reintentar y filtrar funcionan; el historial no ofrece reversión ni acceso a la operación origen. |
| 4 | Consistencia y estándares | 4/4 | La gramática de controles, badges, tipografía y tablas es coherente con el sistema. |
| 5 | Prevención de errores | 3/4 | Editar y ajustar ya están separados; Desactivar aún comparte demasiado peso con acciones rutinarias. |
| 6 | Reconocimiento antes que recuerdo | 3/4 | La fila conserva contexto, cantidad y stock; investigar una anomalía todavía exige comparar muchas filas mentalmente. |
| 7 | Flexibilidad y eficiencia | 2/4 | Hay orden, períodos y atajos globales, pero no filtros de anomalía/tipo ni salto a la venta asociada. |
| 8 | Estética y minimalismo | 3/4 | Cinco columnas reducen ruido, aunque las ventas repetidas convierten el rojo en textura dominante. |
| 9 | Diagnóstico y recuperación de errores | 3/4 | Los errores tienen reintentos claros; una discrepancia de inventario no tiene recuperación contextual desde la fila. |
| 10 | Ayuda y documentación | 1/4 | “Sin salida comercial”, ajustes y consecuencias de mantenimiento carecen de ayuda contextual visible. |
| **Total** |  | **29/40** | **Bueno: base sólida con dos brechas operativas importantes.** |

## Design Specificity Verdict

**Veredicto: producto específico, auditoría todavía genérica.** El marco cacao, el bronce escaso, la moneda dual, el stock, los códigos y la trazabilidad hacen que la pantalla pertenezca a Full Calzado. La nueva composición de cinco columnas es más propia de un libro operativo. Sin embargo, el centro sigue tratando cada movimiento como una fila equivalente; no expresa qué patrón es normal, qué evento es excepcional ni qué operación comercial produjo el cambio.

**Evaluación visual independiente:** la captura confirma buena agrupación del resumen, alineación numérica y una tabla significativamente más limpia. El punto débil es la repetición: dieciséis ventas visualmente idénticas producen fatiga y hacen que el rojo deje de funcionar como señal.

**Escaneo determinista:** `detect.mjs` devolvió `[]` (0 hallazgos, exit 0) para `src/features/product-detail/page.tsx`. No hubo falsos positivos. Es un escaneo estrecho del archivo principal; la revisión de fuente detectó fuera de ese alcance un control interactivo anidado en el filtro de rango.

**Visual overlays:** no se usaron navegador, Playwright ni inyección por la restricción del usuario. No existe overlay visible; la señal alternativa fue la captura 1536×782 y la revisión de fuente.

## Overall Impression

La pantalla ya se siente compacta, seria y operable. En pocos segundos responde qué producto es, cuánto stock tiene y cómo se movió. La mayor oportunidad no es quitar más columnas: es ayudar a distinguir rutina de excepción y convertir una fila sospechosa en una investigación accionable.

### Carga cognitiva

Carga moderada: 2/8 fallos.

- **Jerarquía visual:** la masa del historial domina sobre la salud del producto y no destaca excepciones.
- **Reconocimiento antes que memoria:** detectar una anomalía requiere comparar manualmente cantidades y transiciones entre numerosas filas.
- Cumple foco único, chunking, agrupación, decisiones locales limitadas, una tarea por vez, co-localización y divulgación progresiva.

### Viaje emocional

La entrada inspira control: producto, stock 154, estado y precios aparecen sin rodeos. La revisión comienza fluida, pero cae en fatiga ante una pared de ventas iguales. Ajustar o desactivar introduce riesgo, aunque la cabecera no crea suficiente distancia entre mantenimiento rutinario y cambio de disponibilidad. El final en paginación es neutro: no ofrece conclusión del período ni siguiente paso ante una discrepancia.

## What's Working

- El resumen agrupa inventario, precios y ciclo de vida con buena densidad; stock sigue siendo el valor dominante.
- La tabla de cinco columnas conserva movimiento, instante, cantidad, transición y actor sin repetir Fecha/Hora o Tipo/Detalle.
- El lenguaje visual del negocio es coherente: código monoespaciado, formatos venezolanos y estados expresados con texto además de color.

## Priority Issues

1. **[P1] La rutina oculta la excepción.** Todas las ventas normales reciben badge rojo y peso similar al que tendría un ajuste o devolución. **Por qué importa:** un administrador puede pasar por alto justo el evento que explica una diferencia. **Fix:** añadir un resumen compacto del período (`17 ventas · −18 pares · sin ajustes`) y reservar mayor contraste/separación para ajustes, cambios y devoluciones; mantener las ventas normales en un tratamiento menos urgente. **Comando:** `$impeccable layout` y luego `$impeccable colorize`.

2. **[P1] La trazabilidad termina antes de la operación origen.** “Salida · Venta” no identifica cuál venta generó `155 → 154`. **Por qué importa:** investigar exige salir, recordar hora/cantidad/usuario y buscar manualmente en Ventas. **Fix:** incluir referencia de origen y acción `Ver venta`/`Ver devolución` cuando exista; mantenerla en divulgación secundaria para no reensanchar la tabla. **Comando:** `$impeccable shape`.

3. **[P2] Desactivar conserva demasiado peso de acción cotidiana.** Editar, Ajustar y Desactivar viven juntos con tamaño y borde equivalentes. **Por qué importa:** el cambio de disponibilidad parece tan rutinario como editar una descripción. **Fix:** separar Desactivar con divisor o menú de mantenimiento y conservar el tono warning; mantener la explicación de consecuencias en confirmación. **Comando:** `$impeccable harden`.

4. **[P2] La escala pequeña llega a su límite de legibilidad.** `HISTORIAL DE PRODUCTO`, encabezados y filas son muy compactos; la sección de 10 px se percibe tenue en la captura. **Por qué importa:** baja visión o zoom elevan el esfuerzo en una pantalla usada para comparar datos. **Fix:** subir el encabezado de sección a 11–12 px o darle mayor contraste y comprobar el comportamiento al 200% sin aumentar innecesariamente la altura de filas. **Comando:** `$impeccable typeset`.

5. **[P2] El filtro personalizado contiene controles interactivos anidados.** Un `span role="button"` para limpiar vive dentro del botón que abre el popover. **Por qué importa:** teclado y lector de pantalla pueden anunciar o enfocar una jerarquía inválida. **Fix:** convertir Limpiar en botón hermano real; en móvil validar además la tabla mínima de 640 px con una representación de fila de dos líneas. **Comando:** `$impeccable adapt` y `$impeccable harden`.

## Persona Red Flags

- **Alex, usuario experto:** puede ordenar y paginar, pero no filtrar por tipo/excepción ni saltar a la operación origen. Para investigar una diferencia debe recorrer páginas y cruzar manualmente datos con Ventas.
- **Sam, teclado/lector de pantalla/baja visión:** el limpiador anidado del rango puede producir foco ambiguo; la región horizontal de 640 px obliga a recorrer cinco columnas en móvil; los textos de 10–11 px son frágiles con baja visión.
- **Administrador de tienda bajo presión:** ve tres acciones administrativas casi equivalentes y una sucesión de ventas sin resumen. Debe inferir si la caída es esperada en lugar de recibir una señal de período y una ruta directa al comprobante.

## Minor Observations

- `Cant.` puede volver a `Cantidad` en escritorio ahora que la tabla dispone de más ancho.
- El título completamente en mayúsculas se lee como cadena de sistema; capitalización de lectura facilitaría confirmar la variante.
- “Sin salida comercial: 1 día” ocupa atención aunque no es una condición problemática; podría activarse visualmente solo al cruzar el umbral operativo.
- Las transiciones de stock ya escanean bien; conviene mantenerlas como la referencia numérica principal de cada fila.

## Questions to Consider

- ¿La pantalla debe mostrar todo el historial con el mismo peso o ayudar primero a encontrar la única excepción?
- Cuando alguien ve `155 → 154`, ¿la siguiente acción natural no debería ser abrir la venta que lo produjo?
- ¿“Sin salida comercial” es una métrica permanente o una alerta que solo merece protagonismo al cruzar un umbral?
- ¿Desactivar pertenece a las acciones principales o a un nivel explícito de mantenimiento avanzado?
