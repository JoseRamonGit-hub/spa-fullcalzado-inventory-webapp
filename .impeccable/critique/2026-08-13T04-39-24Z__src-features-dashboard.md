---
target: Ventas por período y tabla Productos más vendidos del dashboard
total_score: 32
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-08-13T04-39-24Z
slug: src-features-dashboard
---
# Ventas por período y Productos más vendidos

## Design Health Score

| # | Heurística | Puntaje | Hallazgo clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3 | Carga, refresco, errores y rangos están bien comunicados; el estado futuro se trunca en la vista semanal. |
| 2 | Correspondencia con el mundo real | 4 | Períodos equivalentes, fechas concretas y USD bruto hablan el lenguaje real de la operación. |
| 3 | Control y libertad | 3 | Los presets y el rango personalizado dan control suficiente y predecible. |
| 4 | Consistencia y estándares | 3 | Componentes y tokens son coherentes; el futuro se presenta de forma distinta entre semana y mes. |
| 5 | Prevención de errores | 3 | Se impiden fechas futuras en el selector, pero un cero se representa con una barra mínima y puede confundirse con actividad. |
| 6 | Reconocimiento antes que memoria | 3 | Leyenda, rangos y valores son visibles; la métrica activa de la tabla no domina visualmente. |
| 7 | Flexibilidad y eficiencia | 3 | Los filtros son rápidos y las filas accionables; el ranking cambia sin reorganizar la jerarquía de lectura. |
| 8 | Diseño estético y minimalista | 3 | La densidad es buena; estados futuros, leyenda, referencia y etiquetas compiten ligeramente. |
| 9 | Reconocer y recuperarse de errores | 4 | Conserva datos durante fallos de refresco, explica el problema y ofrece reintento. |
| 10 | Ayuda y documentación | 3 | Los tooltips son contextuales, pero la ausencia de base comparable merece una explicación semántica más precisa. |
| **Total** |  | **32/40** | **Bueno: base fuerte, con ambigüedades operativas puntuales.** |

## Veredicto de especificidad

La superficie se siente diseñada para Full Calzado, no como un dashboard genérico: la comparación por mismos días transcurridos, la distinción entre operaciones y unidades, los importes brutos y el acceso directo a inventario responden al trabajo real de una zapatería. La composición respeta el lenguaje cálido y compacto de “El Taller de Caja”.

El detector determinista devolvió `[]`: cero hallazgos en `src/features/dashboard/`. Esto confirma que no hay anti-patrones mecánicos detectables, pero no invalida las ambigüedades semánticas observadas en las capturas. No hubo falsos positivos. No se generaron overlays porque el usuario prohibió Playwright; la inspección visual se hizo con las cuatro imágenes adjuntas.

## Impresión general

Es una mejora clara y cercana a producción. La información importante aparece pronto, los períodos comparados son honestos y la tabla permite pasar del diagnóstico a un producto concreto. La mayor oportunidad es hacer que el tiempo y la comparabilidad sean inequívocos: futuro, cero y ausencia de línea base no deben parecer variantes del mismo estado de desempeño.

## Qué funciona

- La referencia comparativa es excelente: “los mismos días transcurridos” evita comparar duraciones desiguales y los rangos concretos permiten verificar la base sin memoria.
- Facturación, operaciones y ticket promedio forman un resumen administrativo útil y correctamente jerarquizado.
- El tooltip oscuro reúne actual, anterior y resultado sin repetir cifras; la tabla conserva unidades, USD bruto y participación, y conecta cada fila con inventario.

## Problemas prioritarios

### P1 — El futuro ocupa el mismo espacio semántico que los datos cerrados

**Por qué importa:** En semana, `Aún no disponible: fech…` se trunca; en mes aparece completo. Tres columnas futuras tienen casi la misma presencia que los días evaluables, por lo que el administrador debe reconstruir mentalmente qué entra realmente en el desempeño.

**Fix:** usar una etiqueta corta y estable, `Fecha futura`, con detalle completo en tooltip y `aria-label`; atenuar el bloque futuro y marcar la transición desde el primer bucket no disponible con un divisor tenue. Mantener sus posiciones preserva la lectura calendárica.

**Comando sugerido:** `$impeccable clarify`

### P1 — “Sin ventas anteriores” está presentado como éxito

**Por qué importa:** El verde comunica mejora, pero una base anterior de cero significa que el crecimiento porcentual no es calculable. Puede inducir una conclusión de rendimiento que los datos no sostienen.

**Fix:** tratarlo como estado informativo neutral: `Sin base comparable` o `Sin ventas en el período anterior`. Mantener `$0.00` visible. Reservar verde para una mejora calculada contra una base mayor que cero. Aplicar la misma semántica al badge y al resultado del tooltip.

**Comando sugerido:** `$impeccable colorize`

### P2 — Un valor de cero se dibuja como una barra

**Por qué importa:** El mínimo visual de 4 px hace que `$0 en ventas` pueda parecer actividad pequeña, especialmente al escanear sin leer la cifra.

**Fix:** representar cero con una línea de base o punto neutral, no con una barra de volumen. Conservar la etiqueta `$0 en ventas` y el valor exacto en tooltip.

**Comando sugerido:** `$impeccable clarify`

### P2 — Cambiar el ranking no cambia la jerarquía de la tabla

**Por qué importa:** `Unidades` y `USD bruto` permanecen con el mismo peso visual. La participación cambia de denominador, pero el encabezado genérico obliga a recordar el toggle activo.

**Fix:** destacar el encabezado y los valores de la métrica activa, atenuar ligeramente la secundaria y mostrar `Participación en unidades` o `Participación en USD bruto`. Conservar ambas columnas y la misma tabla en móvil y escritorio, según la política del producto.

**Comando sugerido:** `$impeccable layout`

## Señales por persona

**Administrador supervisor:** Puede diagnosticar rápidamente facturación, operaciones y ticket. El riesgo es leer el badge verde como crecimiento demostrado y sumar visualmente columnas futuras al desempeño de la semana.

**Alex, usuario experto:** Los presets y filas accionables son eficientes. Al alternar el ranking espera que el foco visual se mueva inmediatamente a la métrica que gobierna el orden; hoy debe verificarlo mediante el toggle y el subtítulo.

**Sam, usuario de teclado o lector de pantalla:** El gráfico tiene región enfocada, etiquetas accesibles y tooltips activables por foco. Debe evitarse que la fila completa y el botón del código creen dos paradas equivalentes para el mismo destino; además, la semántica de cero/futuro debe coincidir entre texto visible y anuncio accesible.

## Carga cognitiva y recorrido emocional

La carga es moderada y apropiada para una superficie administrativa: cuatro presets, tres métricas, dos series y una tabla de seis columnas. El inicio transmite control; la referencia comparable genera confianza; el tooltip confirma detalles. La fricción aparece al final del gráfico, cuando estados futuros se mezclan con datos, y al cambiar el ranking de la tabla, cuando el foco visual no acompaña la decisión.

## Observaciones menores

- La tabla de escritorio preservada en móvil mediante desplazamiento horizontal es una decisión explícita del producto, no un defecto a rediseñar.
- `Ventas brutas del negocio activo` con ayuda contextual es preciso; no hace falta repetir la definición en el lienzo principal.
- Conviene validar contraste real del bronce y los estados semánticos sobre el tooltip oscuro, aunque el detector no pueda medirlo.
- `Operaciones facturadas` es más preciso que `ventas`; debe conservarse.

## Preguntas para considerar

- ¿Una base anterior de cero debe comunicar una victoria o simplemente que todavía no existe comparación válida?
- ¿Los buckets futuros deben sentirse como parte del gráfico de desempeño o como contexto de calendario?
- Cuando se elige `USD bruto`, ¿qué señal debería permitir reconocerlo sin volver a mirar el toggle?
