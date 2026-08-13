---
target: Atención hoy y su relación con los filtros Stock bajo/Estancado de Inventario
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-08-13T05-28-18Z
slug: src-features-dashboard
---
## Design Health Score

| # | Heurística | Puntuación | Problema clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 2/4 | El filtro queda seleccionado, pero el destino no confirma la definición, el alcance ni el orden de prioridad de la alerta. |
| 2 | Correspondencia con el mundo real | 3/4 | “30 días completos” habla bien el idioma del negocio; “Filtrar por día” no describe que filtra la creación del producto. |
| 3 | Control y libertad | 2/4 | La URL conserva el filtro, pero falta una salida contextual clara y un retorno explícito a la cola de triage. |
| 4 | Consistencia y estándares | 3/4 | RPC, etiquetas, color de stock y navegación son coherentes; la prioridad informativa cambia entre mini tabla y tabla completa. |
| 5 | Prevención de errores | 2/4 | Fecha e inclusión de productos inactivos permiten interpretaciones operativas erróneas sin advertencia. |
| 6 | Reconocimiento antes que recuerdo | 2/4 | En “Estancados”, la causa de la alerta queda fuera del primer encuadre y debe recordarse desde el subtítulo. |
| 7 | Flexibilidad y eficiencia | 3/4 | Hay deep-link, búsqueda, ordenamiento y filas operables por teclado; falta restaurar la prioridad por defecto. |
| 8 | Diseño estético y minimalista | 3/4 | La composición es compacta y sobria, pero ambas colas se parecen más de lo que se diferencian sus decisiones. |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 3/4 | Los errores de carga tienen reintento; un conjunto vacío o cambiado tras navegar no explica qué ocurrió. |
| 10 | Ayuda y documentación | 1/4 | No hay ayuda contextual sobre inclusión, ranking, estado activo/inactivo ni combinación de filtros. |
| **Total** |  | **24/40** | **Aceptable: base sólida, pero requiere aclaración semántica.** |

## Design Specificity Verdict

**Evaluación no anclada:** la superficie se siente hecha para Full Calzado. La densidad compacta, los códigos ámbar, el ritmo de tabla y el tono cálido encajan con “El Taller de Caja”. No parece un dashboard genérico. La debilidad está en el traspaso operativo: “Atención hoy” promete dos colas accionables, pero Inventario no reafirma la política, prioridad y alcance que justifican esas colas.

**Escaneo determinista:** 0 hallazgos al ejecutar el detector sobre `src/features/dashboard/components`; no hubo reglas ni ubicaciones que reportar y no se identificaron falsos positivos. El detector confirma que no hay anti-patrones sintácticos obvios, pero no puede detectar los problemas semánticos encontrados en la relación entre módulos.

**Evidencia visual:** no se generaron overlays. Por instrucción explícita del usuario se omitió Playwright y toda automatización de navegador. La evidencia alternativa fueron las tres capturas suministradas y la inspección estática del código.

## Overall Impression

La base es buena: Dashboard e Inventario comparten la misma fuente y el mismo criterio de datos. El gran salto de calidad consiste en hacer visible ese contrato. Hoy el usuario llega al conjunto correcto, pero tiene que inferir por qué cada producto está allí, qué productos abarca la política y cómo se modifica al usar la fecha.

## Cognitive Load

La pantalla no abruma: presenta dos decisiones principales y las agrupa bien. La carga es **moderada** por tres fallas evitables: la razón de estancamiento no queda visible sin desplazamiento, la política activo/inactivo está implícita y el significado de la fecha cambia sin explicación. No se cuestiona la paridad móvil/escritorio de las tablas ni la sombra de desplazamiento ya establecida; el problema es el orden de la información dentro del primer encuadre de la mini tabla.

## Emotional Journey

El inicio transmite control: “Atención hoy” reduce un catálogo enorme a dos colas manejables. La confianza cae al abrir “Estancados”: aparecen productos inactivos y el número de días puede quedar fuera de vista. El destino debería cerrar el recorrido con una confirmación inequívoca, por ejemplo: “137 productos con existencias y 30 días completos o más sin salida comercial, ordenados por mayor antigüedad”.

## What's Working

1. **Existe un contrato real entre módulos.** Dashboard e Inventario usan `get_product_stock_alerts`; el primero pide cinco filas y el segundo todas. Esto evita definiciones divergentes.
2. **Stock bajo está bien definido.** “Productos activos con 3 unidades o menos” coincide con la consulta, y la colorimetría de 0 frente a 1–3 se conserva.
3. **La base tabular es disciplinada.** Hay regiones de desplazamiento nombradas, filas operables por teclado, foco visible, estados vacíos y de error, tooltips de descripciones y navegación directa al detalle.

## Priority Issues

### [P1] La evidencia de “Estancado” queda fuera del momento de triage

**Por qué importa:** en la captura, la mini tabla muestra Código, Descripción y Stock; “Sin salida” y “Estado” quedan tras el desplazamiento horizontal. Stock no explica por qué el producto está estancado.

**Arreglo:** conservar la tabla y su scroll, pero priorizar `Código · Descripción · Sin salida` en el primer encuadre. `Stock` y `Estado` pueden seguir después. Otra opción válida es añadir “157 días sin salida” como segunda línea compacta de la descripción.

**Comando sugerido:** `$impeccable layout`

### [P1] La inclusión de productos inactivos no tiene una lectura operativa clara

**Por qué importa:** Stock bajo incluye solo productos activos; Estancado incluye cualquier producto con stock positivo y 30 días completos sin salida, también inactivos. La captura de Inventario confirma esa mezcla. En “Atención hoy”, el empleado puede leer ambas colas como prioridades equivalentes de reposición.

**Arreglo:** decidir y declarar la política. Si los inactivos son una tarea válida de liquidación/limpieza, indicarlo: “Incluye activos e inactivos con existencias” y hacer Estado visible temprano. Si no lo son, limitar la alerta a activos.

**Comando sugerido:** `$impeccable clarify`

### [P1] El handoff conserva el filtro, pero pierde definición, alcance y prioridad

**Por qué importa:** los CTA llevan correctamente a `status=low_stock` o `status=stagnant`, pero Inventario solo muestra el valor del select. No confirma umbral, política de estado, total ni ranking. La mini tabla tampoco dice “5 de 142”, por lo que su carácter de vista previa queda implícito.

**Arreglo:** mostrar una barra contextual al activar una alerta: “Stock bajo · activos · ≤3 unidades · 142 productos” o “Estancado · con stock · ≥30 días sin salida · 137 productos”, con acción visible para limpiar. El CTA del dashboard puede incorporar el total.

**Comando sugerido:** `$impeccable clarify`

### [P2] “Filtrar por día” es semánticamente peligroso dentro de una alerta

**Por qué importa:** con una alerta activa, la fecha limita `created_at` del producto. No representa la fecha de última salida ni una fotografía histórica de la alerta; los días de estancamiento siguen anclados al hoy de Caracas. “Estancados del día” produciría una interpretación incorrecta y silenciosa.

**Arreglo:** al activar una alerta, renombrar el control a “Fecha de creación” y explicar la combinación; mejor aún, separarlo o deshabilitarlo hasta disponer de un concepto de fecha útil para alertas.

**Comando sugerido:** `$impeccable harden`

### [P2] El orden de urgencia existe, pero no se comunica

**Por qué importa:** la consulta ordena Stock bajo por menor stock y Estancado por mayor antigüedad, después por código. Es buena lógica operativa, pero parece un orden accidental y se pierde al ordenar manualmente otra columna.

**Arreglo:** declarar “Ordenado por menor stock” / “Ordenado por mayor tiempo sin salida”, reflejar el sort inicial y ofrecer “Restablecer prioridad” después de cambiarlo.

**Comando sugerido:** `$impeccable clarify`

## Persona Red Flags

**Alex, usuario experto:** llega rápido al filtro correcto, puede buscar, ordenar y abrir detalles con teclado. Sin embargo, no puede confirmar ni restaurar deliberadamente el orden de prioridad. Combinar Estancado con la fecha puede llevarlo a una decisión rápida pero equivocada, y no conoce el tamaño de la cola antes de cambiar de módulo.

**Sam, empleado que opera durante la jornada:** ve Stock antes que la causa de estancamiento y encuentra productos inactivos en una sección de prioridad inmediata. Sin explicación, puede reponer, reactivar, investigar o ignorar el mismo caso de forma inconsistente.

**Riley, administrador metódico:** puede verificar la regla de Stock bajo, pero no deducir por qué Estancado incluye inactivos. También puede probar el filtro por día y concluir erróneamente que consulta el estado histórico de la alerta.

## Minor Observations

- “Ver todas las alertas” es ambiguo dentro de Stock bajo porque la sección contiene dos tipos de alerta; “Ver todos con stock bajo” sería preciso.
- “Atención hoy” funciona como marco de triage, pero Estancado es una condición vigente de 30 días, no un evento ocurrido hoy. “Prioridades vigentes” podría afinar el subtítulo sin perder urgencia.
- Ocultar el CTA cuando no hay resultados es correcto; el estado vacío puede reforzar cierre positivo: “Sin alertas activas en este momento”.
- La fila abre el detalle del producto, pero el retorno depende del historial del navegador; una sesión de triage se beneficiaría de preservar explícitamente el filtro de origen.
- Las dos tarjetas son hermanas visualmente, aunque sus acciones de negocio son distintas: reponer frente a investigar, liquidar, reactivar o depurar catálogo.

## Questions to Consider

1. ¿Un producto inactivo con existencias es deliberadamente una tarea de “Estancado”, o “Atención hoy” debería contener solo productos vendibles?
2. ¿Cuál es la acción esperada ante un estancado: descontar, transferir, reactivar, corregir movimientos o solo inspeccionar?
3. Si la fecha debe convivir con una alerta, ¿qué fecha real necesita consultar el operador: creación, última salida o estado de la alerta en un corte histórico?
4. ¿La promesa del dashboard es enseñar los cinco casos más urgentes? Si lo es, conviene hacer explícitos el ranking y el total.
