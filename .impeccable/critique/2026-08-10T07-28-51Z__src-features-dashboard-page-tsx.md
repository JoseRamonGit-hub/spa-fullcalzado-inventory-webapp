---
target: dashboard
total_score: 26
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-08-10T07-28-51Z
slug: src-features-dashboard-page-tsx
---
Method: dual-agent (A: dashboard_design_review · B: dashboard_detector_evidence)

# Crítica de diseño — Dashboard

## Salud de diseño

| # | Heurística | Puntuación | Problema clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3 | La carga, el error, la ubicación y la hora se comunican; no se destaca qué excepción requiere actuar ahora. |
| 2 | Correspondencia entre sistema y mundo real | 3 | El lenguaje es mayormente propio del negocio, pero “Total producido” resulta ambiguo junto a “Facturado”. |
| 3 | Control y libertad | 2 | El período puede cambiarse, pero faltan un reinicio claro y rutas directas desde las anomalías a su resolución. |
| 4 | Consistencia y estándares | 3 | Navegación, tarjetas, tablas, tipografía y controles forman un sistema coherente. |
| 5 | Prevención de errores | 3 | El calendario restringe y valida; la jerarquía aún permite ignorar una alerta importante. |
| 6 | Reconocimiento antes que recuerdo | 3 | Las acciones principales son visibles, pero la relación entre “Stock bajo 141” y la lista accionable no lo es. |
| 7 | Flexibilidad y eficiencia | 3 | Los atajos Ctrl+I/J/K y filtros ayudan; no existe un acceso acelerado a las alertas. |
| 8 | Diseño estético y minimalista | 2 | La superficie es limpia, pero gráfico, valores diarios, ranking y alertas compiten por atención. |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 3 | Los estados de error usan lenguaje claro y ofrecen reintento. |
| 10 | Ayuda y documentación | 1 | No hay ayuda contextual para conceptos como “producido”, “USD bruto” o “estancado”. |
| **Total** |  | **26/40** | **Aceptable — base sólida, mejoras significativas necesarias** |

## Veredicto de especificidad

**Evaluación de diseño:** el marco sí está claramente escrito para Full Calzado: cacao, lienzo cálido, bronce escaso, densidad operativa y atajos frecuentes construyen una estación de trabajo reconocible. El cuerpo analítico es menos específico; su secuencia de KPI → gráfico → ranking → alertas podría pertenecer a casi cualquier backoffice minorista. La oportunidad es convertir las excepciones propias de una zapatería —quiebres de tallas/referencias y productos inmovilizados— en el eje de decisión del dashboard.

**Escaneo determinista:** `detect.mjs --json src/features/dashboard/page.tsx` devolvió `[]`, código 0: 0 hallazgos, 0 reglas y 0 ubicaciones. No hubo falsos positivos. Esto confirma que el archivo de entrada evita los patrones mecánicos que inspecciona el detector, pero no certifica la jerarquía de los componentes hijos ni el comportamiento responsivo.

**Evidencia visual:** no existe overlay visible. El navegador automatizado no pudo iniciarse porque falta Chrome en `/opt/google/chrome/chrome`; por ello no fue posible crear una pestaña, prevalidar mutación ni inyectar `detect.js`. Las tres capturas suministradas y el código fuente fueron la señal de respaldo.

## Impresión general

Se siente profesional, compacto y coherente; transmite mejor oficio que un dashboard SaaS genérico. El problema central es de criterio editorial: muestra primero lo que ocurrió y demasiado tarde lo que requiere intervención. Con 141 productos en stock bajo, la pantalla debería funcionar como una cola de decisiones, no solo como un reporte de ventas.

La carga cognitiva es alta: fallan foco único, jerarquía visual, una decisión a la vez y memoria de trabajo. La agrupación, el chunking y la divulgación progresiva están bien resueltos; el selector personalizado aparece solo cuando corresponde.

## Lo que funciona

- La carcasa “El Taller de Caja” tiene carácter real: marco oscuro estable, canvas cálido y bronce reservado para selección y datos importantes.
- Los cuatro indicadores superiores son escaneables y el código cubre carga, vacío, fallo y reintento con mensajes claros.
- Los atajos visibles de inventario, venta y devolución son una buena concesión a la operación repetitiva; las tablas también conservan navegación por teclado.

## Problemas prioritarios

### [P1] Las alertas operativas están enterradas bajo analítica secundaria

**Por qué importa:** “Stock bajo 141” anuncia una excepción considerable, pero no ofrece CTA; para inspeccionarla hay que atravesar comparación de ventas, gráfico y ranking. Esto retrasa reposición y hace que el riesgo parezca otro KPI informativo.

**Corrección:** convertir la tarjeta en una acción explícita —“Revisar 141 productos”— y ubicar una franja compacta “Atención hoy” inmediatamente después de los indicadores, con stock bajo y estancados. Ventas por período pasa al segundo bloque.

**Comando sugerido:** `$impeccable layout`.

### [P1] El dashboard desborda horizontalmente en escritorio

**Por qué importa:** las tres capturas muestran una barra horizontal a 1536 px. Reduce confianza, recorta el área útil y empeora el seguimiento de tablas y gráfico.

**Corrección:** localizar el ancestro que impone ancho mínimo —shell, panel, gráfico o tabla—, aplicar `min-w-0` en la cadena flex/grid y limitar cualquier overflow a su componente. Validar 1024, 1280 y 1536 px; no ocultar la barra global como parche.

**Comando sugerido:** `$impeccable adapt`.

### [P2] El gráfico repite datos sin producir una conclusión

**Por qué importa:** fechas e importes aparecen bajo las barras mientras el eje no aporta escala legible; se consume gran altura para presentar siete cifras que ya podrían compararse de forma más directa.

**Corrección:** mantener una sola etiqueta temporal por barra, llevar el importe exacto a tooltip y alternativa tabular accesible, y añadir una conclusión breve como mejor/peor día o variación. Si no habilita una decisión, sustituirlo por una fila comparativa más compacta.

**Comando sugerido:** `$impeccable distill`.

### [P2] La nomenclatura financiera no es inequívoca

**Por qué importa:** “Total producido” puede significar costo, utilidad, inventario o facturación; “USD bruto” tampoco tiene explicación contextual. Un empleado nuevo debe interpretar antes de actuar.

**Corrección:** validar el significado con el vocabulario canónico y renombrar —por ejemplo, “Ventas brutas hoy” si realmente representa facturación—; añadir una ayuda breve a “USD bruto” y al criterio de producto estancado.

**Comando sugerido:** `$impeccable clarify`.

### [P2] Las tablas accionables parecen contenido estático

**Por qué importa:** las filas abren el detalle del producto, pero la captura no ofrece una señal visual clara. La capacidad de profundizar existe técnicamente y permanece oculta para usuarios nuevos.

**Corrección:** tratar código o descripción como enlace reconocible, sumar un indicador discreto de apertura y elevar “Ver todas…” a una acción secundaria claramente identificable.

**Comando sugerido:** `$impeccable layout`.

## Red flags por persona

**Alex — usuario experto:** los atajos Ctrl+I/J/K funcionan bien, pero no hay acelerador para saltar a las 141 alertas ni una cola operativa priorizada. Debe recorrer análisis de ventas para llegar al abastecimiento y no puede conservar su criterio preferido del ranking.

**Sam — usuario dependiente de accesibilidad:** la estructura semántica, `aria-busy`, errores y activación por teclado son fortalezas. Sin embargo, etiquetas de 10–11 px, el desbordamiento horizontal y la densidad del gráfico se degradarán a 200% de zoom. La alerta depende demasiado de un fondo ámbar tenue; requiere texto y CTA inequívocos. La alternativa textual del gráfico debe comunicar la tendencia, no solo valores aislados.

## Observaciones menores

- “Dashboard” rompe ligeramente una interfaz completamente española; “Resumen” o “Panel” serían más precisos si encajan con el vocabulario canónico.
- La fecha y hora de Caracas están bien contextualizadas, pero 10 px es demasiado pequeño para una señal operativa.
- La captura muestra “3.151unidades” sin separación visual suficiente entre cifra y unidad.
- El rango personalizado está bien planteado: aparece bajo demanda, evita fechas futuras y ofrece validación antes de aplicar.
- Los enlaces “Ver todas las alertas” y “Ver todos los estancados” tienen poco peso para ser salidas de trabajo.

## Preguntas para considerar

1. Si un encargado abre el dashboard con 141 productos en riesgo, ¿por qué su primera acción visible no es revisar o clasificar ese riesgo?
2. ¿“Total producido” es un término financiero que el equipo usa de forma inequívoca o está ocultando una métrica de ventas/facturación?
3. ¿El gráfico semanal conduce a una decisión concreta o solo convierte siete cifras en una sección más alta?
