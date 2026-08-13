---
target: tooltip y barras mensuales de Ventas por período
total_score: 27
max_score: 36
na_heuristics: 9
p0_count: 0
p1_count: 1
timestamp: 2026-08-13T07-05-54Z
slug: ures-dashboard-components-sales-period-section-tsx
---
Method: dual-agent (A: /root/critique_design_a · B: /root/critique_evidence_b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Las fechas exactas aparecen, pero solo después de abrir el tooltip. |
| 2 | Match System / Real World | 2 | Dos barras bajo `07/2026` sugieren dos meses equivalentes, aunque la referencia cruza abril y mayo. |
| 3 | User Control and Freedom | 4 | El filtro se cambia directamente y el tooltip es transitorio. |
| 4 | Consistency and Standards | 3 | La estructura visual es consistente, pero `Anterior` cubre relaciones temporales distintas. |
| 5 | Error Prevention | 3 | El detalle evita ocultar el cálculo, pero `Resultado` permite una lectura equivocada como saldo o pérdida. |
| 6 | Recognition Rather Than Recall | 2 | El usuario debe reconstruir por qué julio se compara con 19 abr.–19 may. |
| 7 | Flexibility and Efficiency | 4 | La gráfica y sus intervalos son accesibles por teclado. |
| 8 | Aesthetic and Minimalist Design | 3 | La segunda serie agrega carga sin aportar una comparación mensual accionable. |
| 9 | Error Recovery | n/a | No aplica a esta interacción informativa. |
| 10 | Help and Documentation | 3 | Hay contexto global del período, pero el par de barras no es autosuficiente. |
| **Total** | | **27/36** | **Bueno; falla semántica localizada.** |

## Design Specificity Verdict

La presentación respeta la densidad, los formatos y el lenguaje visual de Full Calzado, pero la comparación es genérica donde debería ser específica. `Actual`, `Anterior` y `Resultado` no explican que la barra gris es la porción de igual posición dentro de un rango contiguo anterior, no otro mes calendario.

La evaluación determinística reportó 0 hallazgos (`[]`). Es razonable: no se trata de un defecto sintáctico o de estilos detectable automáticamente, sino de una incoherencia entre el significado estadístico y la metáfora visual.

No hubo overlay visible. La inspección autenticada del dashboard no se completó; las capturas del usuario, el componente, sus pruebas y la función SQL fueron la evidencia visual y funcional.

## Overall Impression

La UI está bien resuelta; el problema es uno solo y conceptual. Bajo `07/2026`, las barras gemelas prometen una comparación mes contra mes, pero enfrentan `01–31 jul.` con `19 abr.–19 may.`. El cálculo es consistente por duración y posición, pero la representación no es honesta con esa semántica.

## What's Working

- Las fechas e importes exactos permiten auditar el cálculo.
- Colores, barras y filas del tooltip mantienen una correspondencia visual consistente.
- El período completo sí tiene una comparación válida contra otro rango contiguo de igual duración.

## Priority Issues

### [P1] Una equivalencia mensual que no existe

- **Why it matters:** el usuario interpreta naturalmente `07/2026` como julio y espera que la barra gris represente junio, julio anterior u otro mes calendario comparable. `19 abr.–19 may.` rompe esa expectativa y `Resultado −$59.40` le da autoridad a una comparación difícil de explicar y poco accionable.
- **Fix:** cuando un rango personalizado use granularidad mensual, mostrar una sola barra por mes calendario. Eliminar en ese modo la barra anterior, su leyenda y las filas `Anterior` y `Resultado`. Mantener la comparación agregada de los períodos completos en las métricas superiores.
- **Suggested command:** `$impeccable clarify`

## Persona Red Flags

**Alex (Power User):** no puede escanear el desempeño mensual con confianza: la barra gris también controla la escala y debe abrir cada tooltip para descubrir que no representa otro mes.

**Sam (Accessibility-Dependent):** el `aria-label` anuncia actual, anterior y diferencia, pero conserva la misma ambigüedad conceptual. La accesibilidad técnica no corrige una relación temporal mal nombrada.

**Jordan (First-Timer):** puede interpretar `Resultado −$59.40` como pérdida o saldo de julio, no como diferencia contra un tramo móvil de 31 días.

## Minor Observations

- El comportamiento pertenece a rangos `Personalizado` mayores de 60 días, no al preset `Este mes`.
- El backend crea correctamente meses calendario para la serie actual y desplaza cada bucket por su posición dentro del rango comparable anterior.
- No hace falta cambiar el backend: `analyzeCustomSalesRange` ya identifica la granularidad `month`.

## Questions to Consider

- Si la comparación por bucket no puede nombrarse en una frase corta, ¿merece ocupar la mitad de la gráfica?
- ¿Aporta más valor comparar cada mes contra un tramo móvil o leer con claridad la evolución mensual del rango elegido?

## Recommended Action

Aplicar `$impeccable clarify` con una condición de presentación: para `custom` con granularidad `month`, conservar únicamente la serie actual y un tooltip con `Julio 2026`, `01–31 jul. 2026` y `Ventas: $7,203.90`. No construir una nueva lógica mes-a-mes salvo que el producto defina explícitamente qué calendario y qué reglas de meses incompletos necesita.
