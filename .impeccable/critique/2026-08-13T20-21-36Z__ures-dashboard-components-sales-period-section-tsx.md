---
target: selector de rango de fecha de Ventas por período del dashboard
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-13T20-21-36Z
slug: ures-dashboard-components-sales-period-section-tsx
---
## Design Health Score

| # | Heurística | Puntaje | Hallazgo clave |
|---|---|---:|---|
| 1 | Visibilidad del estado | 2/4 | El pie valida, pero la selección parcial se presenta como error y el dashboard desaparece. |
| 2 | Correspondencia con el mundo real | 4/4 | Terminología clara y local sobre ventas, fechas y negocio activo. |
| 3 | Control y libertad | 2/4 | Falta Cancelar/Limpiar explícito y una vía evidente para corregir el borrador. |
| 4 | Consistencia y estándares | 3/4 | El primitive es consistente, pero móvil y escritorio cambian sustancialmente el coste del flujo. |
| 5 | Prevención de errores | 3/4 | Bloquea fechas futuras y rangos incompletos, pero no guía el extremo pendiente. |
| 6 | Reconocimiento antes que recuerdo | 2/4 | No existen estados persistentes y explícitos de Inicio y Fin. |
| 7 | Flexibilidad y eficiencia | 2/4 | Buenos presets generales; faltan accesos recurrentes o entrada eficiente para rangos históricos. |
| 8 | Estética y minimalismo | 2/4 | Limpio, pero el colapso de aproximadamente 45 rem a 5 rem rompe la continuidad. |
| 9 | Recuperación ante errores | 2/4 | El mensaje identifica el problema, pero no ofrece una acción concreta de recuperación. |
| 10 | Ayuda y documentación | 1/4 | No explica el flujo de dos pasos ni la comparación automática resultante. |
| **Total** | | **23/40** | **Aceptable; requiere mejoras significativas.** |

## Design Specificity Verdict

La sección sí está escrita para Full Calzado mediante “Ventas brutas del negocio activo” y la comparación contra un período anterior equivalente. El selector, sin embargo, sigue siendo un calendario shadcn genérico: no representa el modelo operativo “Inicio → Fin → comparación”, ni ayuda a interpretar el resultado que producirá.

El detector determinista devolvió cero hallazgos para `src/features/dashboard/components/sales-period-section.tsx`. No hay falsos positivos. La ausencia de findings confirma que las deficiencias principales son de interacción, continuidad espacial y comunicación de estado, fuera del alcance del detector de patrones.

No se generaron overlays: la inspección de navegador se omitió por la instrucción explícita de usar únicamente las capturas adjuntas. La evidencia alternativa fue la comparación de esas capturas con el componente y sus pruebas.

## Overall Impression

Los presets rápidos y las restricciones del calendario forman una base sólida. El gran problema es que “Personalizado” se comporta como si navegar al filtro invalidara la lectura actual: reemplaza métricas, gráfica y productos por una sola instrucción, y luego exige interpretar un rango mediante señales demasiado implícitas.

## What's Working

- Los cuatro presets cubren recorridos frecuentes en un toque y están correctamente agrupados.
- El sistema impide fechas futuras y deshabilita `Aplicar rango` hasta tener una selección válida.
- Móvil ya reduce la vista a un mes, evitando el desbordamiento más obvio de los dos paneles.

## Priority Issues

### [P1] “Personalizado” destruye la continuidad del dashboard

**Por qué importa:** el contenido cae de métricas, gráfica y tabla a un bloque de apenas `py-6`; parece pérdida de datos y obliga a reorientarse.

**Arreglo:** conservar los últimos resultados mientras el rango está en borrador. Si se desea enfatizar que aún no se aplicó, atenuarlos y mostrar una banda contextual junto al selector; no reemplazar todo el módulo. Como mínimo, conservar la estructura y la sección de productos hasta aplicar.

**Comando sugerido:** `$impeccable layout`

### [P1] El rango no tiene un modelo visible de dos pasos

**Por qué importa:** un día con borde no comunica inequívocamente “inicio seleccionado”; en móvil el usuario navega recordando ese extremo.

**Arreglo:** mostrar arriba del calendario dos slots persistentes, `Inicio` y `Fin`. Tras el primer toque, anunciar “Inicio: 13 ago. · Ahora selecciona la fecha de fin”. Cuando sea válido, mostrar duración y período comparativo.

**Comando sugerido:** `$impeccable clarify`

### [P1] La adaptación responsive cambia el coste de la tarea

**Por qué importa:** escritorio presenta dos meses densos; móvil presenta uno, pero obliga a navegar sin contexto persistente. Los targets del primitive son de 32 px, pequeños para uso táctil cómodo.

**Arreglo:** mantener dos meses solo donde cada celda conserve tamaño cómodo. En móvil usar una superficie de tarea de ancho completo con resumen sticky Inicio/Fin, targets de al menos 44 px y acciones inferiores persistentes.

**Comando sugerido:** `$impeccable adapt`

### [P2] Faltan salidas y recuperación explícitas

**Por qué importa:** cerrar fuera descarta de facto el borrador al reabrir, pero no hay `Cancelar` ni `Limpiar`; el usuario debe descubrir esa semántica.

**Arreglo:** añadir `Cancelar` y `Limpiar`, preservar o descartar el borrador de forma declarada y no usar rojo para un paso inicial normal.

**Comando sugerido:** `$impeccable harden`

## Persona Red Flags

**Alex (usuario experto):** los presets son eficientes, pero todo rango no estándar exige navegar, escoger dos días y aplicar. No hay atajos para quincena, semana anterior o último cierre, ni entrada directa.

**Jordan (primera vez):** al tocar “Personalizado” ve desaparecer los datos y recibe una frase genérica. No sabe si el 13 con borde es inicio, fin o foco; tampoco qué comparación aparecerá al aplicar.

**Sam (accesibilidad):** el popover tiene título accesible y autofocus, pero Inicio/Fin dependen demasiado de color y forma. La selección parcial necesita estado textual cercano y anunciado; los controles de 32 px son débiles para limitaciones motoras.

## Cognitive Load and Emotional Journey

Carga cognitiva moderada: fallan “una cosa a la vez”, “memoria de trabajo” y “elecciones mínimas”. El recorrido empieza con confianza gracias a los presets, cae al vacío al escoger Personalizado y convierte el primer toque válido en un aparente error rojo. La recuperación emocional llega únicamente cuando el rango se completa y se habilita el CTA.

## Minor Observations

- `Seleccionar fechas` debería progresar a una instrucción específica tras elegir el inicio.
- Permitir navegar desde 1900 añade ruido en una herramienta operativa; conviene justificar o limitar el histórico real disponible.
- En móvil, este flujo merece dialog/drawer de tarea, no un popover comprimido.

## Questions to Consider

1. ¿Por qué el filtro debería borrar la lectura actual antes de que exista una consulta nueva válida?
2. ¿Conviene que el calendario sea el centro de la interacción, o que solo sea el mecanismo para completar dos campos claramente nombrados?
3. ¿Qué rangos recurrentes de una zapatería —quincena, semana pasada, último cierre— merecen un preset y evitarían abrir el calendario?
