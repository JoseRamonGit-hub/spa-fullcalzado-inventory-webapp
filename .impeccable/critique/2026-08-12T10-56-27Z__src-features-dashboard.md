---
target: Ventas por período y Top productos del dashboard
total_score: 29
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-08-12T10-56-27Z
slug: src-features-dashboard
---
# Crítica: Ventas por período y Top productos

## Design Health Score

| # | Heurística | Score | Hallazgo principal |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3/4 | Hay skeletons, errores, reintento y `aria-busy`; un refetch con caché puede quedar sin señal visual y no se comunica la frescura del dato. |
| 2 | Correspondencia entre sistema y mundo real | 4/4 | “Facturación bruta”, “operaciones facturadas” y “ticket promedio” hablan el idioma operativo de la zapatería. |
| 3 | Control y libertad | 3/4 | Los cuatro presets y el rango personalizado dan control suficiente; el rango no ofrece limpieza o restablecimiento explícito. |
| 4 | Consistencia y estándares | 3/4 | La composición es coherente; el chevron del código parece ser el enlace aunque la acción real vive en toda la fila. |
| 5 | Prevención de errores | 3/4 | Se impiden rangos incompletos, invertidos y futuros, y “Aplicar rango” se deshabilita correctamente. |
| 6 | Reconocimiento antes que recuerdo | 3/4 | Los dos rangos permanecen visibles, pero el usuario debe recomponer mentalmente porcentaje, base anterior y fechas. |
| 7 | Flexibilidad y eficiencia | 3/4 | Presets, rango libre, dos rankings y filas operables por teclado cubren bien el trabajo frecuente. |
| 8 | Diseño estético y minimalista | 3/4 | Es sobrio y compacto; las etiquetas de 10 px y la comparación meramente textual reducen la claridad analítica. |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 3/4 | Los errores principales permiten reintentar; el error del ranking aporta poco contexto. |
| 10 | Ayuda y documentación | 1/4 | Falta contexto para porcentajes extremos, “bruto” y “No disponible”. |
| **Total** |  | **29/40** | **Bueno: base sólida, con problemas de interpretación que sí afectan decisiones.** |

## Design Specificity Verdict

### Evaluación no anclada

La superficie se siente hecha para Full Calzado, aunque no es visualmente inconfundible. La combinación de negocio activo, facturación bruta, bloque anterior de igual duración, códigos de producto, unidades y USD está bien anclada al dominio. La paleta cálida, el bronce escaso, las cifras tabulares y la densidad compacta encajan con “El Taller de Caja”.

Lo intercambiable es el mecanismo visual: toggle segmentado, tres KPI, barras sin eje y tabla rayada. El producto aparece en el contenido más que en la forma de explicar el negocio. La mayor oportunidad no es decorativa: es convertir una colección correcta de datos en una lectura comercial inequívoca.

### Escaneo determinista

El detector devolvió **0 hallazgos** en `src/features/dashboard/`; no hubo reglas ni ubicaciones que reportar. Tampoco hubo falsos positivos. La revisión manual sí encontró riesgos que el detector no modela: refetch sin indicador visible, valores del gráfico en mono contra el sistema tipográfico, tabla de ancho mínimo de 42 rem en móvil y falta de contexto estadístico.

### Evidencia visual

No se generaron overlays. La inspección por navegador se omitió por la prohibición explícita de Playwright; se usaron las cuatro capturas adjuntas y evidencia del código como señal alternativa.

## Impresión general

La pantalla inspira orden y confianza operativa: se entiende rápido qué período está activo y los importes exactos están siempre a la vista. Sin embargo, todavía muestra datos más de lo que los explica. El gran salto de calidad sería hacer que el usuario entienda en segundos no solo cuánto se facturó, sino contra qué base, por qué cambió y qué producto explica ese cambio.

La carga cognitiva es baja: **1 fallo de 8**. Solo falla levemente el foco único porque tendencia y ranking comparten un bloque; chunking, agrupación, jerarquía, decisiones, memoria de trabajo y divulgación progresiva pasan.

El recorrido emocional empieza con orientación y control, cae ante `+2859%` y “No disponible”, recupera confianza gracias a los valores exactos, y termina sin confirmar cuándo se actualizaron realmente los datos.

## Qué funciona

1. **Comparación temporal bien modelada.** Los presets son fáciles de reconocer y el rango personalizado se compara con un bloque contiguo de igual duración; las fechas actual/anterior permanecen visibles.
2. **Estados honestos.** El modelo distingue cero facturado, período vacío y bucket futuro/no disponible; esa base semántica permite corregir la presentación sin rehacer los datos.
3. **Ranking operativo.** Código, descripción, unidades y USD bruto forman una tabla densa y útil; el criterio cambia sin perder el período y las filas son accesibles con teclado.

## Priority Issues

### [P1] El porcentaje extremo eclipsa su base

**Por qué importa:** `+2859%` parece una señal extraordinaria, pero nace de comparar $23,406.50 con apenas $791.00. El badge domina mientras la base anterior queda como microcopy. Un administrador puede sobreinterpretar el crecimiento.

**Fix:** presentar primero la comparación absoluta: `$23,406.50 vs $791.00 · +$22,615.50`, y dejar `+2,859%` como dato secundario. Cuando la base sea cero, usar “Nuevo” con explicación explícita en vez de fingir una tasa comparable.

**Suggested command:** `$impeccable clarify`

### [P1] Cero facturado y día futuro casi parecen el mismo estado

**Por qué importa:** en la semana actual, miércoles `$0.00` significa “día transcurrido sin facturación”, mientras jueves–domingo significan “aún no ocurrió”. Ambos quedan apagados, pequeños y pegados al baseline; “No disponible” además suena a error de sincronización.

**Fix:** cambiar la copia a `$0 facturado` y `Aún no transcurrido`, y distinguirlos con forma además de color: marca sólida mínima para cero y placeholder discontinuo para futuro. Añadir una leyenda compacta solo cuando haya buckets futuros.

**Suggested command:** `$impeccable clarify`

### [P2] El gráfico promete comparación, pero solo dibuja el período actual

**Por qué importa:** la microcopy anuncia una comparación contra ayer, semana anterior, mes anterior o bloque contiguo. El gráfico no permite verla; obliga a saltar entre el total anterior y la distribución actual. Esa es la principal pregunta analítica de la sección.

**Fix:** representar la serie anterior con barras tenues adyacentes o marcas de referencia por bucket. Si el backend no expone buckets anteriores, reducir la promesa visual y mostrar una banda compacta “actual vs anterior” con cambio absoluto.

**Suggested command:** `$impeccable shape`

### [P2] Top productos enumera ganadores, pero no explica su peso

**Por qué importa:** la tabla dice quién lidera, pero no cuánto explica cada producto del período. Una lista de 10 filas obliga al administrador a calcular mentalmente la concentración y no ayuda a decidir reposición o riesgo de dependencia.

**Fix:** añadir una señal compacta de contribución según el criterio activo —porcentaje del total o barra in-cell— y hacer explícito en el encabezado que el orden actual es por unidades o USD bruto. Mantener ambos valores numéricos visibles.

**Suggested command:** `$impeccable shape`

### [P2] El ranking pierde eficacia en móvil y su acción es implícita

**Por qué importa:** el ancho mínimo de 42 rem fuerza scroll horizontal. Además, el chevron está pegado al código pero la fila completa es la acción; esto diluye el affordance y el nombre accesible solo anuncia el código.

**Fix:** en móvil, convertir cada fila en un bloque compacto con rango/código, descripción y las dos métricas; en escritorio conservar la tabla. Hacer del código/descripción un enlace explícito o reforzar que toda la fila abre detalle. Incluir descripción y criterio en el nombre accesible.

**Suggested command:** `$impeccable adapt`

## Persona Red Flags

**Alex — usuario experto:** cambia rápido período y ranking y puede abrir filas con Enter, pero no puede comparar buckets actuales/anteriores ni saltar directamente entre filtros y tabla. La interfaz le entrega exactitud, no velocidad analítica.

**Sam — usuario dependiente de accesibilidad:** cuenta con regiones rotuladas, foco visible y activación Enter/Espacio. Los problemas son etiquetas de gráfico a 10 px, estados diferenciados de forma muy tenue, valores en `font-mono` contra la regla tipográfica y un `aria-label` de fila que omite descripción y métricas.

**Empleado de jornada:** entiende los términos, pero puede confundir facturación bruta con dinero disponible, “No disponible” con una falla y un porcentaje extremo con crecimiento estable. Necesita significado instantáneo, no reconstrucción estadística.

## Observaciones menores

- “Productos más vendidos” sería más directo que “Top productos” sin perder precisión.
- El reloj actual del dashboard no equivale a “datos actualizados a”; no debe funcionar como sustituto.
- Los valores del gráfico usan mono aunque el sistema lo reserva para códigos y atajos; deberían usar Inter con cifras tabulares.
- Los rótulos de intervalo a 10 px son demasiado frágiles para un dato primario.
- El estado vacío de ventas y el estado vacío del ranking pueden duplicar el mismo mensaje.
- El rayado, la alineación derecha y la densidad de filas sí están muy bien resueltos.

## Preguntas a considerar

- ¿La decisión principal es evaluar crecimiento, detectar días débiles o decidir reposición? Hoy la pantalla intenta cubrir las tres sin declarar una dominante.
- ¿La serie anterior debe existir visualmente, o la comparación es solo contexto del KPI?
- ¿Conviene tratar un porcentaje sobre una base muy pequeña como crecimiento o como “actividad nueva/no comparable”?
- ¿Qué acción debería seguir al detectar un producto líder: abrir detalle, revisar stock o iniciar reposición?
