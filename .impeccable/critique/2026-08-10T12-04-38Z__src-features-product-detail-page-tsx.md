---
target: Ver detalle de producto
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-10T12-04-38Z
slug: src-features-product-detail-page-tsx
---
Method: dual-agent (A: /root/critique_design · B: /root/critique_detector)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Estado y actividad son visibles, pero el orden activo y el alcance del período son demasiado sutiles. |
| 2 | Match system / real world | 3/4 | El lenguaje del dominio funciona; “Sin salida” no se explica y el icono de papelera contradice una desactivación reversible. |
| 3 | User control and freedom | 3/4 | Hay regreso y reactivación, pero no undo y la vuelta depende del historial del navegador. |
| 4 | Consistency and standards | 3/4 | El sistema visual es cohesivo; algunos colores de cantidades y la iconografía destructiva rompen la semántica. |
| 5 | Error prevention | 2/4 | La confirmación de desactivación ayuda, pero “Editar” mezcla datos de catálogo con una corrección de existencias de mayor riesgo. |
| 6 | Recognition rather than recall | 3/4 | El historial conserva actor, hora y stock, pero obliga a recordar esos datos para buscar la operación de origen en otro módulo. |
| 7 | Flexibility and efficiency | 2/4 | Hay períodos, orden y paginación; faltan filtros de auditoría y acceso directo a la operación fuente. |
| 8 | Aesthetic and minimalist design | 3/4 | Es compacta y sobria, aunque siete hechos con igual peso y datos repetidos generan ruido. |
| 9 | Error recovery | 3/4 | Existen reintentos, pero los errores no distinguen red, permisos, producto ausente o contexto de negocio desactualizado. |
| 10 | Help and documentation | 2/4 | La vista se entiende en general; “Sin salida”, las flechas de stock y la procedencia no tienen ayuda contextual. |
| **Total** | | **27/40** | **Aceptable: base sólida, mejoras significativas pendientes.** |

## Design Specificity Verdict

**Veredicto: marco autoral, núcleo intercambiable.** El cacao y bronce, el negocio activo, los formatos venezolanos, la densidad de libro mayor y el vocabulario de movimientos pertenecen claramente a Full Calzado. Sin embargo, el centro de la vista sigue siendo un patrón administrativo genérico: una barra de título, siete hechos equivalentes y una tabla rayada. Al quitar el shell y cambiar etiquetas, serviría para casi cualquier inventario. La oportunidad es convertir identidad del producto, confianza en las existencias y linaje de auditoría en una composición inequívoca del producto.

**Escaneo determinista:** `detect.mjs` devolvió `[]`, con 0 hallazgos en `src/features/product-detail/page.tsx`. No hubo reglas, ubicaciones ni falsos positivos. Esto no contradice la revisión visual: confirma que los problemas prioritarios son estructurales y semánticos, no infracciones mecánicas detectables.

**Visual overlays:** omitidos por instrucción del usuario; no se usó Playwright, navegador, servidor ni inyección. La evidencia visual fue la captura adjunta.

## Overall Impression

La pantalla transmite control y trazabilidad básica: el negocio, el producto, el stock y el responsable están presentes. Su mayor debilidad es que el historial termina justo antes de responder la pregunta que motiva una auditoría: “¿qué operación produjo este cambio?”. Hoy funciona como registro pasivo, no como puesto de investigación.

### Cognitive load

Carga moderada: 3/8 fallos.

- **Chunking:** siete datos ocupan una sola franja y exceden el límite de cuatro elementos por grupo.
- **Grouping:** identidad, inventario, precio y ciclo de vida están contiguos, pero no agrupados semánticamente.
- **Visual hierarchy:** descripción, stock, precios, estado y actividad compiten con escala casi idéntica.
- Cumple foco único, secuenciación, decisiones locales limitadas, co-localización y divulgación progresiva.

### Emotional journey

La entrada es segura: negocio, sección activa, descripción, código y estado orientan rápido. El pico debería ser la certeza de que las existencias cuadran, pero la jerarquía plana vuelve ese momento meramente clerical. El historial gana confianza con actor, hora, cantidad firmada y stock antes→después, aunque la repetición esconde anomalías. El botón rojo con papelera genera ansiedad de borrado permanente para una acción reversible. El final no ofrece cierre: no hay operación fuente ni señal explícita de conciliación.

## What’s Working

- El libro de movimientos es denso pero legible: fecha y hora locales, cantidades con signo, transición de stock, responsable y badges semánticos sirven a la operación real.
- El marco persistente y el negocio visible refuerzan la frontera multi-negocio, el principio más crítico del producto.
- La superficie conserva un lenguaje compacto, cálido y sobrio; el color semántico apoya la lectura sin convertir la tabla en un tablero estridente.

## Priority Issues

### [P1] El historial no llega hasta el origen auditable

**Why it matters:** “Salida por venta” explica qué ocurrió, pero no identifica qué venta lo produjo. Para investigar una diferencia, el administrador debe salir, buscar y recordar hora, usuario y cantidad.

**Fix:** añadir una columna o detalle “Origen” con tipo e identificador de la operación y una acción “Ver operación” cuando exista; agrupar renglones pertenecientes a la misma operación si aplica.

**Suggested command:** `$impeccable shape`.

### [P1] Una corrección de existencias está escondida dentro de “Editar”

**Why it matters:** mezclar código, descripción y precio con stock colapsa mantenimiento de bajo riesgo y corrección operativa de alto riesgo bajo una sola entrada mental.

**Fix:** separar “Editar datos” de “Ajustar existencias”; en el segundo flujo mostrar stock actual→nuevo, delta, motivo y consecuencia auditada antes de confirmar.

**Suggested command:** `$impeccable harden`.

### [P2] El resumen no declara qué dato manda

**Why it matters:** siete valores equivalentes fuerzan un barrido completo y diluyen la respuesta que la mayoría busca primero: stock y salud del producto.

**Fix:** usar el nombre del producto como `h1` y el código como eyebrow; formar tres grupos compactos: Inventario (stock/sin salida), Precio (USD/VES) y Estado (activo/última actividad), con stock como valor dominante.

**Suggested command:** `$impeccable layout`.

### [P2] Desactivar parece borrar

**Why it matters:** papelera + rojo sugiere eliminación permanente y contradice el concepto reversible, generando miedo innecesario antes de interactuar.

**Fix:** usar iconografía de pausa, archivo o bloqueo que corresponda al dominio; reservar el tratamiento destructivo fuerte para la confirmación y explicar exactamente qué operaciones deja de permitir el producto.

**Suggested command:** `$impeccable clarify`.

### [P2] El historial es preciso, pero las anomalías se pierden

**Why it matters:** Fecha y Hora separadas, “Salida” repetido en Tipo y Detalle, y la falta de filtros por tipo o usuario convierten 20 filas similares en ruido.

**Fix:** combinar “Fecha y hora” en una sola columna ordenable, eliminar texto redundante, añadir filtros ligeros si la frecuencia de auditoría lo justifica y mantener el encabezado visible durante el scroll.

**Suggested command:** `$impeccable distill`.

## Persona Red Flags

### Alex (power user)

Puede leer el stock rápido, pero no saltar de una fila sospechosa a su operación, buscar el historial ni filtrarlo por tipo o usuario. Fecha y Hora se ordenan por separado. Su ruta más rápida sigue siendo cruzar manualmente datos en otro módulo.

### Sam (screen reader, keyboard, low vision)

Hay buenas bases: títulos, estructura de datos, tabla real, controles etiquetados y tipo de movimiento expresado con texto además de color. Pero la dirección de orden debería exponerse con `aria-sort`; etiquetas de 10 px y texto muted son frágiles para baja visión; en móvil una tabla ancha obliga a navegación horizontal; controles de 28–32 px y filas de 30 px resultan exigentes para usuarios con limitaciones motoras.

### Administrador de zapatería

Necesita supervisar stock, identificar responsables y mantener productos dentro del negocio activo. El actor y el contexto de negocio funcionan, pero un movimiento sospechoso no se puede rastrear hasta su Venta, Devolución o Cambio, y “Editar” no avisa que incluye existencias. La supervisión depende de memoria y búsqueda cruzada.

## Minor Observations

- Separar la etiqueta de módulo del nombre: “Detalle del producto: chola R/D playera dama ROXY” se comporta como una frase y se truncará pronto.
- Cambiar “30 días” por “Últimos 30 días” o añadir una etiqueta compacta al selector.
- Ocultar primero/anterior/siguiente/último cuando los 19 registros caben en una sola página; `Pág. 1/1` más cuatro flechas deshabilitadas es chrome muerto.
- Preferir “Días sin salida comercial” o explicar con tooltip qué eventos reinician el conteo.
- Enrutar los colores de cantidad por tokens semánticos para conservar consistencia en tema oscuro.
- Suavizar ligeramente las franjas alternas y reforzar hover/focus para que las ventas repetidas no dominen la pantalla.

## Questions to Consider

- ¿Esta pantalla es un registro pasivo o el puesto de trabajo del administrador para investigar un producto?
- ¿Qué dato debe responderse en dos segundos: stock, salud del stock, precio o última actividad?
- ¿La desactivación es tan peligrosa como para mostrarse en rojo antes de interactuar, o el riesgo real comienza dentro de la confirmación?
- Cuando alguien ve `48 → 47`, ¿la siguiente pregunta natural no es “qué venta fue”?
