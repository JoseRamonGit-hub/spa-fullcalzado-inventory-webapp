---
target: todas las tablas y columnas de la app
total_score: 26
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-08-11T07-00-27Z
slug: src-components-ui-data-table-tsx
---
# Crítica del sistema de tablas y columnas

## Design Health Score

| # | Heurística | Puntaje | Hallazgo clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3 | Skeletons, paginación y conteos funcionan; el desbordamiento horizontal móvil casi no se anuncia. |
| 2 | Correspondencia con el mundo real | 3 | El vocabulario del negocio es sólido, pero `VES`, `Bs.` y `BS` compiten. |
| 3 | Control y libertad del usuario | 3 | Buscar, filtrar, ordenar y paginar es claro; la navegación por fila compite con acciones internas. |
| 4 | Consistencia y estándares | 2 | Fecha/hora, moneda, densidad móvil y visibilidad de columnas cambian por módulo. |
| 5 | Prevención de errores | 2 | Acciones de 24 px, iconos compactos y scroll poco visible elevan el riesgo operativo. |
| 6 | Reconocimiento antes que recuerdo | 3 | Códigos, badges y cifras alineadas ayudan; el usuario debe inferir scroll y comportamiento de la fila. |
| 7 | Flexibilidad y eficiencia | 3 | Atajos, ordenación, búsqueda y paginación favorecen al operador frecuente. |
| 8 | Diseño estético y minimalista | 3 | La densidad cálida y sobria funciona; algunas excepciones rompen el ritmo compacto. |
| 9 | Reconocer y recuperarse de errores | 2 | Existen estados vacíos y de carga, pero los errores no ofrecen una recuperación visible. |
| 10 | Ayuda y documentación | 2 | ARIA y tooltips aportan una base; faltan pistas visibles de scroll y de intención de las filas. |
| **Total** | | **26/40** | **Aceptable — buena base con inconsistencias operativas importantes** |

## Veredicto de especificidad

**Evaluación independiente:** 7/10. El sistema se siente propio de Full Calzado: códigos de producto, stock, USD/VES, tasa de cambio, devoluciones, cierres y contexto del negocio activo. La paleta cálida y la densidad se sienten como una consola de operación, no como una tabla SaaS genérica.

**Escaneo determinista:** 88 avisos globales en `src`: 84 de tamaño tipográfico, 3 de color y 1 de radio. Solo 3 avisos tipográficos tocaron tablas: cabecera compartida de 10 px, badge de tasa/cambio de 10 px y contador de negocios de 10 px. No hubo hallazgos en `data-table.tsx`. Los valores de 10 px son decisiones compactas localizadas; el problema real es que `DESIGN.md` documenta 11 px. Hay que elegir y documentar una sola regla, no aumentar tamaños de forma indiscriminada.

**Evidencia visual:** Chromium confirmó en desktop filas compartidas de 30 px, cuerpo de 13 px y cabeceras de 28 px/10 px. En móvil, inventario, transacciones, movimientos, devoluciones y cierres contienen el overflow dentro de la tabla y conservan el ancho de la página. La inyección del overlay de Impeccable no llegó a completarse porque su servidor temporal agotó el tiempo de arranque; no se afirma que exista un overlay visible.

## Impresión general

No hace falta rediseñar ni construir una mega-abstracción. La base compartida ya acierta en lo importante. La mayor oportunidad es convertir lo que hoy es una convención parcial en un contrato inequívoco: misma densidad, misma presentación temporal, mismas reglas financieras y paridad de columnas en móvil mediante scroll horizontal.

`returns` debe ser la guía para **fecha y hora unificadas** y para la lectura compacta, pero no debe convertirse en la implementación canónica completa: su expansión y tabla anidada son particularidades del dominio. Además, las tablas principales ya comparten con `returns` el mismo tamaño real de 13 px y filas de 30 px; la percepción de mayor compactación proviene sobre todo de la composición de columnas y de unir fecha/hora.

## Qué funciona

- El núcleo `Table` + `DataTable` logra una gramática consistente: filas de 30 px, cuerpo de 13 px, striping, hover, cabeceras compactas, sorting, skeletons, vacíos y paginación.
- Las cifras están mayormente alineadas a la derecha, los códigos tienen alta saliencia y los badges semánticos permiten barrer inventario y operaciones rápidamente.
- En las tablas operativas principales, el scroll horizontal móvil ya funciona sin ensanchar el documento. La solución correcta es reforzarlo, no reemplazar la tabla por tarjetas.

## Mapa de consistencia por superficie

| Superficie | Estado | Discrepancia principal | Dirección |
|---|---|---|---|
| Inventario | Casi canónica | Oculta `Acciones` en móvil; 3 botones de 24 px; fila navegable y acciones compiten. | Conservar densidad; justificar drawer móvil; aclarar navegación/acciones. |
| Transacciones | Consistente visualmente | `Fecha` y `Hora` separadas; 9 columnas y scroll poco anunciado. | Unificar `Fecha y hora`; conservar todas las columnas y mejorar affordance del scroll. |
| Movimientos | Consistente visualmente | `Fecha` y `Hora` separadas; etiqueta `Tasa` ambigua. | Unificar timestamp y vocabulario financiero. |
| Devoluciones | Mejor referencia semántica | Tabla expandida/anidada es específica; no debe generalizarse. | Tomar timestamp y densidad, no la arquitectura de expansión. |
| Cierres de caja | Compacta y estable | Convención monetaria/fecha debe alinearse con el resto. | Mantener; normalizar etiquetas y formatos. |
| Usuarios | Mayor desviación móvil | Oculta 5 de 6 columnas y crea una fila de 122 px con datos duplicados. | Recuperar columnas desktop y scroll horizontal; evitar el pseudo-card. |
| Historial de producto | Buena base | Oculta `Usuario`; fila móvil crece a 47 px y apila fecha/hora. | Conservar `Usuario`; una sola celda de fecha/hora sin romper ritmo innecesariamente. |
| Dashboard — top/stock | Excepción no documentada | Oculta descripción/estado y fuerza filas móviles de 44 px. | Si cada columna es vital, restaurarlas y permitir scroll; documentar cualquier excepción real. |
| Pendientes en modales | Parcialmente consistentes | Reemplazan/duplican columnas en móvil; cuerpo frecuente de 12 px. | Mantener tabla y scroll salvo que el dato compuesto sea una decisión explícita. |
| Confirmaciones | Excepción plausible | En móvil cambian tabla por grid apilado y ocultan cabecera. | Puede justificarse por ser revisión previa a confirmar, no exploración/comparación; documentarla como excepción. |
| Edición de producto | Excepción plausible | Sustituye tabla desktop por bloques `Actual/Nuevo`. | Mantener solo si la comparación sigue siendo inequívoca; no usarla como patrón global. |

## Problemas prioritarios

### [P1] El contrato móvil no se cumple en todas las superficies

**Qué:** Usuarios oculta 5/6 columnas; dashboard oculta descripción/estado; historial oculta `Usuario`; varios modales sustituyen columnas o la tabla completa.

**Por qué importa:** La nueva restricción de producto considera vital cada columna. Ocultarla obliga a confiar en una representación alternativa, rompe la equivalencia desktop/móvil y hace que el operador aprenda dos tablas distintas.

**Solución:** Mantener columnas por defecto, `overflow-x-auto`, un ancho mínimo explícito por tabla y una pista de borde/sombra cuando exista contenido fuera del viewport. Tratar `hideOnMobile` como excepción revisada, no como optimización responsive automática. Inventario puede conservar el drawer de acciones si ofrece exactamente la misma capacidad; los diálogos de confirmación pueden ser excepciones porque su tarea es revisar y confirmar, no comparar registros.

**Comando sugerido:** `$impeccable adapt`

### [P1] Fecha y hora describen el mismo hecho con contratos distintos

**Qué:** Transacciones y movimientos separan `Fecha`/`Hora`; devoluciones e historial usan `Fecha y hora`.

**Por qué importa:** Consume una columna adicional, fragmenta el barrido cronológico y hace que módulos contiguos parezcan sistemas distintos.

**Solución:** Adoptar el patrón de `returns`: una columna `Fecha y hora`, un único formateador es-VE/America-Caracas y ordenación por timestamp real. Centralizar el formateo, no una fábrica compleja de columnas.

**Comando sugerido:** `$impeccable distill`

### [P1] Acciones y navegación de fila no tienen suficiente separación operativa

**Qué:** Inventario combina fila navegable con tres acciones de 24×24 px. El usuario debe inferir si abre detalle, edita, ajusta stock o cambia estado.

**Por qué importa:** Es un entorno de trabajo rápido y los objetivos son menores que los 36–44 px documentados. Un clic impreciso puede iniciar la operación equivocada.

**Solución:** Hacer visible la intención de abrir detalle en la celda identidad; separar visualmente la zona de acciones; agrupar acciones secundarias en un menú etiquetado si reduce ambigüedad. En móvil, el drawer puede ser la excepción deliberada y debe conservar todas las operaciones.

**Comando sugerido:** `$impeccable harden`

### [P2] La centralización está en el nivel correcto, pero el contrato semántico está disperso

**Qué:** Nueve superficies consumen `DataTable`, mientras las tablas de modales y confirmaciones usan `Table` o markup directo. La divergencia no nace principalmente de `DataTable`, sino de columnas, formatos y overrides responsive locales.

**Por qué importa:** Forzar todo a pasar por un `DataTable` gigante crearía sobreingeniería. Dejar formatos y excepciones sin contrato seguirá produciendo drift.

**Solución:** Mantener tres capas: primitives visuales en `Table`, comportamiento de listado en `DataTable`, columnas específicas dentro de cada feature. Centralizar solo reglas estables: `formatDateTime`, etiquetas monetarias, densidad compacta, affordance de overflow y alineación numérica. No crear una fábrica universal de columnas.

**Comando sugerido:** `$impeccable document`

### [P2] Terminología, feedback y excepciones no están suficientemente explicitados

**Qué:** Coexisten `VES`, `Bs.` y `BS`; aparecen `Cant.`, `Devol.` y `Tasa`; errores no ofrecen reintento; el scroll horizontal carece de señal clara.

**Por qué importa:** En conciliación de caja y auditoría, pequeños desacuerdos de etiqueta generan más riesgo que una diferencia ornamental.

**Solución:** Elegir vocabulario canónico (`Tasa Bs./USD`, una sola forma monetaria), mostrar contexto de filtros/resultados, añadir recuperación en errores y documentar la lista corta de excepciones móviles.

**Comando sugerido:** `$impeccable clarify`

## Carga cognitiva

Resultado: **moderada (3 fallos de 8)**.

- Falla consistencia: timestamps y monedas requieren normalización mental entre módulos.
- Falla memoria de trabajo en móvil: al desplazarse, la identidad del producto puede salir de vista.
- Falla reconocimiento: el usuario debe descubrir que hay columnas vitales a la derecha y distinguir la intención de la fila frente a sus acciones.

La cantidad de columnas no es el problema: corresponde a la complejidad intrínseca de la operación. La tarea de diseño es contenerla con scroll claro, alineación, orden estable y contexto de fila.

## Recorrido emocional

La entrada es confiable: negocio activo, tasa y navegación ubican al operador. En desktop, la primera lectura es rápida y profesional. El valle aparece bajo presión: en móvil hay que descubrir el scroll y luego mantener mentalmente la identidad de la fila; en inventario, acciones compactas elevan la duda. El cierre es adecuado gracias a paginación y conteos, pero los errores no ofrecen una salida visible.

## Alertas por persona

**Alex — operador experto:** La densidad y los atajos le favorecen. Pierde velocidad cuando `Fecha`/`Hora` ocupan dos columnas y cuando debe interpretar tres iconos pequeños o descubrir columnas fuera del viewport.

**Sam — usuario de teclado/lector o baja visión:** La semántica de tabla, `aria-sort` y labels son una buena base. Los objetivos de 24 px, el scroll horizontal sin señal robusta y la pérdida de la columna identidad complican el seguimiento de filas. Debe verificarse navegación horizontal por teclado y foco visible.

**Riley — administrador que audita excepciones:** Encontrará representaciones distintas del mismo dato: `VES`/`Bs.`/`BS`, timestamp unido/separado y columnas que desaparecen solo en ciertos módulos. Esto reduce confianza al reconciliar operaciones.

## Observaciones menores

- `returns` no usa realmente una tipografía de cuerpo menor que las demás tablas principales: comparte 13 px y filas de 30 px. Su mejor compactación es compositiva.
- La cabecera compartida de 10 px es legible pero no coincide con los 11 px documentados. Mantener 10 px es válido si se actualiza la autoridad visual y se verifica contraste/zoom.
- Usuarios rompe más el ritmo: 36–37 px en desktop y 122 px en móvil por contenido multilinea.
- Dashboard usa 44 px en móvil y oculta datos; esa decisión parece heredada de una idea de touch target aplicada a toda la fila.
- El nested table de devoluciones mide aproximadamente 990 px y sigue dentro del scroll del padre; necesita cuidado con dobles contextos de overflow.
- La paginación comunica escala de manera útil (`1–20 de 420`, `1–20 de 691`).

## Preguntas a considerar

- ¿Debe `Código` permanecer visible al desplazar todas las tablas, o basta una sombra de borde y el orden estable de columnas?
- ¿Las confirmaciones móviles son la única familia autorizada a abandonar la cuadrícula tabular por una lista `Actual/Nuevo`?
- ¿El drawer móvil de inventario cuenta como equivalencia suficiente para omitir la columna `Acciones`, o debe conservarse también esa columna?
