---
target: KPI del dashboard, incluidos sus iconos
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-13T06-31-50Z
slug: src-features-dashboard-page-tsx
---
## Design Health Score

| # | Heurística | Puntaje | Problema clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 2/4 | Hay carga, error y reintento, pero no se comunica la frescura real de las cifras ni se anuncian claramente los cambios asíncronos. |
| 2 | Correspondencia con el mundo real | 2/4 | “Stock bajo” y su umbral son claros; “Total producido” contradice el vocabulario canónico del negocio. |
| 3 | Control y libertad | 3/4 | Stock bajo ofrece una salida directa al inventario filtrado; las demás tarjetas son deliberadamente informativas. |
| 4 | Consistencia y estándares | 3/4 | Tarjetas, tokens e iconos siguen un patrón coherente; la CTA de ancho completo altera el ritmo comparativo. |
| 5 | Prevención de errores | 2/4 | El umbral está explicado, pero 142 alertas no se segmentan por agotado frente a 1–3 unidades. |
| 6 | Reconocimiento antes que recuerdo | 3/4 | Etiquetas e iconos acompañan las cifras; la relación entre bruto, devoluciones y cifra principal exige reconstrucción mental. |
| 7 | Flexibilidad y eficiencia | 2/4 | El drill-down de stock es eficiente, pero llega a una lista grande sin adelantar el criterio de prioridad. |
| 8 | Diseño estético y minimalista | 3/4 | Cuatro bloques son escaneables y sobrios; el CTA y algunos textos secundarios cargan de más una fila de comparación. |
| 9 | Recuperación de errores | 3/4 | El fallo tiene mensaje y reintento, aunque la causa es genérica y el cambio no tiene región viva explícita. |
| 10 | Ayuda y documentación | 1/4 | No hay ayuda contextual para la métrica financiera ni para interpretar la urgencia de stock bajo. |
| **Total** |  | **24/40** | **Aceptable — requiere mejoras importantes** |

## Design Specificity Verdict

**Evaluación humana:** Parcialmente específico. La paleta cálida, el umbral de tres unidades y la ruta a Inventario pertenecen al producto; la composición de cuatro tarjetas con etiqueta, pictograma, número y pie sigue siendo un patrón SaaS intercambiable. La oportunidad no es decorar más, sino expresar mejor la lógica de una zapatería: caja neta frente a facturación bruta y reposición priorizada frente a un conteo plano.

**Escaneo determinístico:** `detect.mjs` devolvió `[]`: 0 hallazgos, 0 reglas y 0 ubicaciones. No hubo falsos positivos. El detector confirma que no existen infracciones mecánicas evidentes, pero no puede detectar el conflicto de vocabulario de dominio, la precisión de los iconos ni la carga decisional de “142”.

**Superposición visual:** No se creó. Por la restricción explícita del usuario no se usó navegador, Playwright ni servidor local; la captura suministrada y el código fueron la señal visual de respaldo.

## Overall Impression

La primera lectura es ordenada, confiable y suficientemente compacta. La mayor oportunidad es hacer que cada tarjeta responda una pregunta inequívoca: cuánto se facturó neto, cuántas operaciones hubo, cuánto inventario queda y qué requiere atención primero. Hoy la forma funciona mejor que el significado.

## What's Working

- La jerarquía `etiqueta → cifra → explicación` permite barrer las cuatro KPI con rapidez y `tabular-nums` estabiliza la lectura numérica.
- `ReceiptText` para operaciones y `TriangleAlert` para stock bajo son asociaciones fuertes. Los iconos son decorativos (`aria-hidden`), así que la interfaz no depende de ellos para transmitir el nombre de la métrica.
- Stock bajo recibe una superficie `warning` y una CTA solo cuando hay productos afectados. El estado sano elimina ruido y el estado accionable enlaza al filtro correcto.
- Los skeletons preservan la geometría y el error ofrece reintento; no se presentan ceros falsos durante la carga.

## Priority Issues

### [P1] “Total producido” contradice el lenguaje del dominio

**Por qué importa:** `CONTEXT.md` define “Total facturado” como la suma bruta y marca explícitamente “Total producido” como término a evitar. La cifra protagonista parece ser el neto tras devoluciones, pero su etiqueta puede interpretarse como ganancia, ingreso o producción física.

**Corrección:** Si el valor es facturación menos créditos por devoluciones, llamarlo “Neto facturado” o el término de dominio que se acuerde; debajo mostrar un desglose compacto “Facturado $X · Devoluciones −$Y”. Si representa bruto, usar “Total facturado” y eliminar la duplicación del pie. El icono `CircleDollarSign` es reconocible, pero no resuelve esta ambigüedad verbal.

**Comando sugerido:** `$impeccable clarify`

### [P1] La alerta comunica volumen, no prioridad operativa

**Por qué importa:** “142” provoca urgencia sin responder qué atender primero. Mezcla agotados con productos que aún tienen 1–3 unidades, dos condiciones operativas distintas.

**Corrección:** Desglosar el pie en “X agotados · Y con 1–3 unidades” cuando esos datos estén disponibles, y usar una CTA explícita como “Priorizar reposición” o “Ver 142 productos”. Si ese desglose requiere backend, mantener el frontend actual y al menos aclarar “Incluye agotados”.

**Comando sugerido:** `$impeccable clarify`

### [P2] La CTA de ancho completo rompe el ritmo de las cuatro KPI

**Por qué importa:** Una tarjeta se convierte en panel de acción y gana altura/peso frente a tres tarjetas de resumen. En una fila diseñada para comparar, el botón compite con el número más importante.

**Corrección:** Convertir la acción en un enlace compacto al pie, alineado con la descripción, manteniendo toda la tarjeta visualmente equivalente. No hacer toda la tarjeta clicable: eso ocultaría la interacción y complicaría la semántica.

**Comando sugerido:** `$impeccable layout`

### [P2] Dos iconos son entendibles, pero no suficientemente precisos

**Por qué importa:** `CircleDollarSign` comunica dinero, no neto frente a bruto; `Boxes` comunica logística o bultos, no necesariamente unidades disponibles de un catálogo de calzado. En cambio, `ReceiptText` y `TriangleAlert` sí representan con precisión operación facturada y condición de riesgo.

**Corrección:** Conservar recibo y alerta. Elegir el icono financiero después de resolver el nombre —por ejemplo, recibo/moneda con signo menos si se trata de neto—. Para stock, preferir `PackageOpen`, `Warehouse` o el mismo símbolo que identifica Inventario en la navegación, priorizando consistencia sobre novedad. No introducir cuatro colores distintos: el ámbar debe seguir reservado para marca y advertencia.

**Comando sugerido:** `$impeccable polish`

### [P2] La accesibilidad estructural y responsiva tiene huecos

**Por qué importa:** Los títulos individuales son `div`, no encabezados; la carga y la resolución del error carecen de una región viva explícita. Desde 360 px se fuerzan dos columnas, donde “3.169 unidades” y los pies extensos pueden refluír y ralentizar la comparación.

**Corrección:** Representar cada título como encabezado semántico dentro de la sección; anunciar carga/error/éxito con una región de estado concisa. Validar la rejilla a 360 px y, si el contenido salta, mantener una columna hasta un ancho donde las cifras quepan sin reducir tipografía.

**Comando sugerido:** `$impeccable audit`

## Persona Red Flags

**Alex — encargado experto:** La discrepancia entre “Total producido” y “Total facturado” añade una comprobación mental en una lectura que debería durar segundos. Al ver 142 alertas llega al inventario sin saber si debe empezar por agotados, menor stock o mayor rotación.

**Sam — usuario con baja visión o lector de pantalla:** Las etiquetas de 10 px, mayúsculas y color atenuado son frágiles con zoom o fatiga visual. Los títulos de cada KPI no forman una estructura navegable y la transición asíncrona de skeleton a datos no tiene anuncio explícito.

**Casey — encargado móvil y distraído:** En 360 px recibe dos tarjetas por fila con cifras y descripciones largas. La CTA se reconoce, pero no anticipa que abrirá una lista filtrada de 142 elementos ni qué criterio deberá seguir allí.

## Minor Observations

- El reloj de Caracas no demuestra cuándo se actualizaron las métricas; hora actual y frescura de datos son señales distintas.
- La etiqueta de 10 px en mayúsculas funciona visualmente, pero conviene validar contraste y legibilidad a 200% de zoom en ambos temas.
- Si stock bajo llega a cero, conviene cerrar el bucle con una descripción positiva como “Sin productos con stock bajo”, no solo retirar color y CTA.
- Mantendría el icono dentro de su contenedor de 32 px: aporta ritmo sin robar protagonismo. El problema es semántico, no de tamaño.

## Questions to Consider

- ¿La cifra financiera protagonista es bruto, neto tras devoluciones o dinero efectivamente cobrado? Su nombre e icono deben derivarse de esa respuesta.
- Cuando aparecen 142 productos, ¿la tarea real es verlos todos o empezar por agotados y mayor rotación?
- ¿Las KPI deben limitarse a informar, o cada una debe convertirse en entrada a un análisis? La respuesta define si la CTA de stock es una excepción útil o una inconsistencia.
