---
target: Período actual y período anterior de Ventas por período
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-13T19-54-49Z
slug: src-features-dashboard
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Los períodos son visibles, pero el rango compacto dificulta validarlos de un vistazo. |
| 2 | Match System / Real World | 3 | El vocabulario es correcto; la raya apretada no comunica el intervalo con suficiente claridad. |
| 3 | User Control and Freedom | 3 | El selector funciona, pero el delta no usa revelación progresiva. |
| 4 | Consistency and Standards | 3 | Hay lenguaje consistente, aunque raya y punto medio mezclan funciones de separación. |
| 5 | Error Prevention | 2 | La composición puede inducir una lectura errónea del rango, sobre todo en móvil. |
| 6 | Recognition Rather Than Recall | 2 | El usuario debe segmentar cuatro fechas y distinguir dos comparaciones simultáneas. |
| 7 | Flexibility and Efficiency | 3 | Los presets ayudan; la comparación secundaria aún ralentiza el escaneo. |
| 8 | Aesthetic and Minimalist Design | 2 | Delta absoluto y período anterior compiten en la misma línea. |
| 9 | Error Recovery | 3 | “Sin base comparable” resuelve bien el caso sin referencia válida. |
| 10 | Help and Documentation | 3 | Existe infraestructura accesible de tooltip, pero no se aprovecha para la diferencia. |
| **Total** | | **27/40** | **Saludable, con fricción clara en el núcleo comparativo.** |

## Design Specificity Verdict

**LLM assessment:** 3/4. La superficie se siente propia de una herramienta operativa venezolana por su lenguaje, formato y densidad. Sin embargo, la referencia se resuelve como una frase genérica comprimida, no como una comparación diseñada para lectura rápida.

**Deterministic scan:** 0 hallazgos en `src/features/dashboard/components/sales-period-section.tsx`. El detector no contradice la revisión: la carga cognitiva nace de decisiones semánticas y de composición que no infringen reglas mecánicas. El código confirma que `formatPeriodRange()` concatena con raya sin espacios y `formatMetricComparison()` antepone la diferencia a “Período anterior”.

**Visual overlays:** No se generaron. La inspección de navegador y Playwright se omitió por restricción explícita del usuario; se usaron las capturas suministradas y el código fuente como evidencia.

## Overall Impression

La jerarquía principal funciona, pero el marco comparativo se vuelve una frase que hay que descifrar. La mayor oportunidad es separar claramente las dos ventanas temporales y aplicar revelación progresiva al delta absoluto.

## What's Working

- “Referencia: los mismos días de la semana anterior” explica correctamente la lógica de comparación.
- La estructura etiqueta → valor → contexto conserva una jerarquía sólida en los KPI.
- El componente de tooltip existente soporta hover, foco, toque y Escape, por lo que la propuesta puede ser accesible también en móvil.

## Priority Issues

### [P1] El intervalo se lee como texto continuo

**Why it matters:** “10 ago. 2026–13 ago. 2026” carece de respiración; la raya puede confundirse con resta y en móvil la asociación entre etiqueta y fechas se debilita al envolver.

**Fix:** Representar cada período como un par semántico independiente. Usar dos renglones en móvil y permitir disposición horizontal sólo cuando haya ancho. Expresar el intervalo como `10 ago. 2026 — 13 ago. 2026` o, con máxima claridad lingüística, `del 10 ago. al 13 ago. 2026`.

**Suggested command:** `$impeccable adapt`

### [P1] La diferencia absoluta compite con el baseline

**Why it matters:** En Facturado y Operaciones el usuario recibe porcentaje/dirección, delta absoluto y valor anterior a la vez. El baseline pierde protagonismo y aumenta la pausa de interpretación.

**Fix:** Dejar visible únicamente `Período anterior: …`. Añadir junto a esa línea un trigger de información visible y accesible cuyo tooltip diga `Diferencia: +$580.40` o `Diferencia: −71`. Mantener el badge porcentual; porcentaje visible y delta absoluto bajo demanda cumplen funciones distintas.

**Suggested command:** `$impeccable distill`

### [P2] La referencia no estructura los dos pares temporales

**Why it matters:** Las fechas son el contrato de lectura del gráfico, pero el punto medio obliga a segmentar manualmente la frase.

**Fix:** Usar dos grupos reales, con etiqueta y valor, `tabular-nums`, `flex-col` en móvil y una transición responsiva a fila en desktop si el contenido cabe. El separador no debe ser el único portador de estructura.

**Suggested command:** `$impeccable layout`

### [P2] El tooltip podría quedar oculto por una affordance débil

**Why it matters:** Si el delta se mueve bajo demanda, un icono diminuto o sólo tonal lo volvería indescubrible y difícil de tocar.

**Fix:** Usar un botón de información con objetivo táctil suficiente, `aria-label="Ver diferencia frente al período anterior"`, foco visible y contenido completo. No depender únicamente de hover.

**Suggested command:** `$impeccable harden`

## Persona Red Flags

**Empleado en piso de venta:** En móvil, después de leer `$839.80`, debe confirmar rápidamente que compara lunes–jueves con lunes–jueves. La línea actual contiene cuatro fechas y dos delimitadores, obligándolo a releer bajo presión.

**Administrador supervisor:** En desktop recibe porcentaje, delta y baseline simultáneamente. Debe decidir cuál cifra usar para explicar el cambio, aunque el período anterior es la referencia verificable.

**Usuario con baja visión o zoom:** La envoltura puede separar fragmentos de fecha de “Período actual/anterior”; la estructura textual no conserva con suficiente fuerza la asociación.

## Minor Observations

- `Ticket promedio` ya usa el patrón deseado: muestra sólo el período anterior.
- Conviene mantener una raya tipográfica para intervalos, pero acompañada de espacios o de `del … al …`.
- El tooltip no debe duplicar el badge porcentual: la mejor división es porcentaje visible y diferencia absoluta bajo demanda.

## Questions to Consider

- ¿El porcentaje ya responde la pregunta cotidiana “mejoró o empeoró”, dejando el delta para una consulta puntual?
- Si el gráfico depende de esos rangos, ¿por qué se presentan como nota corrida y no como dos unidades legibles?
- ¿Debe el usuario calcular algo mentalmente o basta con revelar la diferencia exacta cuando la solicite?
