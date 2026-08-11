---
target: src/features/product-detail/
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-11T02-12-56Z
slug: src-features-product-detail
---
⚠️ DEGRADED: single-context (spawn_agent unavailable in this session)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Loading, error y estado activo son visibles; falta feedback más explícito después de guardar acciones desde los modales. |
| 2 | Match System / Real World | 4/4 | Código, stock, precios, entradas/salidas y responsable corresponden bien al lenguaje operativo de una zapatería. |
| 3 | User Control and Freedom | 3/4 | Volver y cerrar modales están disponibles; desactivar depende de confirmación, pero no hay una salida contextual clara desde el encabezado. |
| 4 | Consistency and Standards | 4/4 | Los botones de mantenimiento comparten implementación y acciones con Inventario. |
| 5 | Error Prevention | 3/4 | La desactivación usa confirmación y el ajuste tiene revisión; falta hacer más visible el impacto sobre stock antes de abrir el flujo. |
| 6 | Recognition Rather Than Recall | 3/4 | Las etiquetas de botones ayudan; “Sin salida comercial” y los iconos de ajuste requieren conocimiento del dominio. |
| 7 | Flexibility and Efficiency | 3/4 | Hay atajos globales para entradas/ventas/devoluciones, pero no para editar, ajustar o volver desde esta vista. |
| 8 | Aesthetic and Minimalist Design | 3/4 | La superficie es limpia, aunque el encabezado y la franja de resumen compiten con una tabla que ocupa poco contenido. |
| 9 | Error Recovery | 3/4 | Hay reintentos separados para resumen e historial; los errores podrían explicar mejor qué datos sí permanecen confiables. |
| 10 | Help and Documentation | 3/4 | La vista no necesita documentación adicional para operadores expertos; solo conviene conservar etiquetas y estados claros. |
| **Total** | | **32/40** | **Sólida y operable; necesita una pasada de jerarquía y responsive.** |

## Design Specificity Verdict

**LLM assessment:** La vista sí está anclada al producto: separa precio USD/VES, muestra actividad comercial, responsable y movimientos de inventario. La identidad cálida del sistema aparece en el shell oscuro y acentos ámbar, pero el detalle central todavía se siente como una tabla administrativa genérica: mucho lienzo vacío, poca estructura para una decisión concreta y un encabezado con acciones de igual peso.

**Deterministic scan:** 1 hallazgo advisory en `src/features/product-detail/page.tsx:79`: `text-[10px]` está fuera de la escala tipográfica documentada. Se considera una excepción intencional y válida para esta vista compacta, donde varias etiquetas deben coexistir en poco espacio.

## Overall Impression

La vista funciona y transmite confianza operativa, pero parece diseñada para “mostrar datos” más que para ayudar a decidir qué hacer con el producto. La mayor oportunidad es convertir el resumen superior en una zona de lectura rápida y hacer que la acción primaria dependa del estado real del producto.

## What's Working

- El nombre del producto, código y stock están visibles antes del historial; eso permite verificar contexto rápidamente.
- La información está agrupada en inventario, precios y ciclo de vida, y los movimientos usan señales claras de Entrada/Salida.
- Los botones de mantenimiento no duplican lógica: Detalle importa el componente compartido de Inventario y abre los mismos `EditProductModal`, `AdjustProductStockModal` y `ToggleStatusModal`.

## Priority Issues

### [P1] Jerarquía insuficiente entre acciones de mantenimiento

**Why it matters:** Editar y Ajustar son acciones frecuentes y de importancia equivalente, mientras Desactivar es una acción de ciclo de vida potencialmente destructiva. La barra actual no expresa esa diferencia de riesgo sin crear una jerarquía artificial entre Editar y Ajustar.

**Fix:** Mantener Editar y Ajustar con peso equivalente. Separar visualmente únicamente Desactivar/Reactivar como acción de estado y mayor riesgo. En producto inactivo, “Reactivar” debe conservar su tratamiento positivo. No cambiar nombres ni iconos solo en Detalle: cualquier ajuste debe aplicarse al componente compartido y validarse en la tabla y el drawer móvil de Inventario.

**Suggested command:** `$impeccable layout` / `$impeccable polish`

### [P1] El encabezado consume demasiado protagonismo para una vista con poca densidad

**Why it matters:** En la captura, la franja superior, resumen e historial ocupan aproximadamente los primeros 300px y después queda un gran vacío. El usuario no recibe una lectura más útil de ese espacio.

**Fix:** Mantener el historial como foco, pero hacer que el resumen tenga una banda más compacta y que la tabla comunique explícitamente “sin movimientos en el período” cuando corresponda. En pantallas amplias, considerar una columna lateral estrecha para resumen/acciones solo si conserva la lectura rápida; en móvil, mantener el flujo vertical.

**Suggested command:** `$impeccable layout`

### [P1] Responsive del toolbar es frágil

**Why it matters:** El código oculta las etiquetas con `hidden sm:inline` y `hidden md:inline`, pero conserva tres botones en el encabezado. En anchos intermedios puede quedar una mezcla de botones con texto e iconos que cambia la anchura y compite con el nombre truncado.

**Fix:** Definir un breakpoint explícito: escritorio muestra etiquetas; tablet muestra solo iconos con tooltip; móvil usa una acción “Más”/drawer o un menú agrupado. Los tres destinos deben seguir llamando exactamente a las mismas callbacks y modales compartidos de Inventario.

**Suggested command:** `$impeccable adapt`

### [P2] “Ajustar” y “Editar” necesitan equilibrio visual deliberado

**Why it matters:** Ambas acciones son frecuentes para administradores: una cambia existencias y la otra cambia nombre o precio. Si una se presenta como claramente primaria, se falsea la frecuencia real y se obliga al operador a reinterpretar la barra.

**Fix:** Conservar ambas como acciones hermanas, con el mismo tamaño y tratamiento. La única separación fuerte debe reservarse para Desactivar/Reactivar. No hace falta añadir explicación dentro del modal: el contexto operativo ya es conocido por los usuarios.

**Suggested command:** `$impeccable polish`

## Button Verification

Los botones están funcionalmente correctos y alineados con Inventario:

| Botón en Detalle | Implementación compartida | Equivalente en Inventario | Veredicto |
|---|---|---|---|
| Editar | `ProductMaintenanceActions` → `EditProductModal` | Acción de fila / drawer móvil | Correcto |
| Ajustar | `ProductMaintenanceActions` → `AdjustProductStockModal` | Acción de fila / drawer móvil | Correcto; peso equivalente a Editar |
| Desactivar/Reactivar | `ProductMaintenanceActions` → `ToggleStatusModal` | Acción de fila / drawer móvil | Correcto; separar visualmente por riesgo |
| Volver | `router.history.back()` con fallback `/inventory` | No es una acción de fila | Correcto; preservar historial |

No recomiendo cambiar iconos ahora. `Pencil`, `Boxes` y `CirclePause/CirclePlay` son reconocibles, accesibles mediante `aria-label`, y están centralizados en `src/features/inventory/components/product-maintenance-actions.tsx`. Si se cambia uno, debe cambiarse en esa fuente compartida y verificarse también `src/features/inventory/columns.tsx` y `src/features/inventory/components/mobile-action-drawer.tsx`.

## Persona Red Flags

**Alex (Power User):** Los botones tienen texto y los modales son rápidos de reconocer, pero no hay atajos para editar/ajustar/volver. Para una operación repetitiva, Alex debe abrir cada modal desde la misma barra y cerrar el flujo manualmente.

**Jordan (First-Timer):** Puede no distinguir “Ajustar” de “Carga de Inventario”, pero esta interfaz está dirigida a operadores con conocimiento del contexto; no es necesario introducir ayuda adicional dentro del modal.

**Empleado operativo:** La pantalla muestra el historial, pero no ofrece acciones de venta/devolución específicas para este producto; debe volver al shell y usar los accesos globales. Eso puede ser correcto por alcance, pero debe ser una decisión explícita.

## Minor Observations

- “Última actividad” combina badge y fecha en una línea que puede comprimirse en tablet.
- El filtro “Últimos 30 días” está bien ubicado, pero debería conservar una indicación visible cuando el usuario elige un rango personalizado.
- En la captura, “Stock actual” es el dato más importante, pero no tiene tratamiento de destaque equivalente al nombre; un número grande o una señal de stock bajo mejorarían el escaneo sin añadir ruido.
- La tabla alterna filas y usa encabezados claros; conviene conservar ese patrón en cualquier rediseño.

## Questions to Consider

- ¿El tratamiento visual actual comunica que Editar y Ajustar son acciones hermanas, o una parece accidentalmente secundaria?
- ¿La separación visual de Desactivar/Reactivar es suficiente para comunicar su mayor riesgo?
- ¿El equilibrio entre resumen e historial permite operar rápido sin perder trazabilidad?
