---
target: modal Ajustar existencias y Confirmar ajuste de existencias
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-11T01-14-19Z
slug: nventory-components-adjust-product-stock-modal-tsx
---
## Salud del diseño

| # | Heurística | Nota | Hallazgo clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 4 | El primer paso explica el cambio en vivo y ambos pasos muestran estados pendientes; la operación es legible en todo momento. |
| 2 | Correspondencia con el mundo real | 4 | “Existencias”, “total final”, “motivo” e “historial” usan lenguaje operativo preciso. |
| 3 | Control y libertad | 3 | Se puede cancelar o volver desde la confirmación, pero “Cancelar” no explica que conserva el borrador. |
| 4 | Consistencia y estándares | 3 | El sistema visual es coherente; el delta pierde su badge semántico en la confirmación. |
| 5 | Prevención de errores | 3 | Hay validación, bloqueo sin cambios y revisión; llevar el producto a cero no recibe una advertencia especial. |
| 6 | Reconocer antes que recordar | 3 | El primer paso reúne todo el contexto, pero la confirmación obliga a recordar el producto. |
| 7 | Flexibilidad y eficiencia | 3 | Autofoco y flujo compacto; la doble confirmación es razonable, aunque no optimiza ajustes repetidos. |
| 8 | Diseño estético y minimalista | 3 | El primer modal tiene jerarquía y ritmo sólidos; la confirmación es limpia, pero demasiado genérica. |
| 9 | Recuperación de errores | 2 | Un conflicto concurrente cierra el flujo y descarta nuevo total y motivo. |
| 10 | Ayuda y documentación | 3 | Las ayudas inline son claras; falta orientación específica para stock cero y conflictos. |
| **Total** | | **31/40** | **Bueno; el primer paso está resuelto y la confirmación necesita más contexto y recuperación.** |

## Veredicto de especificidad

El primer paso se siente propio de Full Calzado: negocio activo, producto, código, estado, total actual, nuevo total, diferencia y motivo forman una secuencia operativa concreta. La superficie es sobria, cálida y compacta, coherente con “El Taller de Caja”.

La confirmación retrocede hacia un patrón genérico. Conserva negocio, cifras y motivo, pero elimina la identidad del producto. En el punto de mayor riesgo, el usuario ya no puede probar visualmente qué SKU va a modificar. La oportunidad principal no es añadir decoración, sino convertir la confirmación en un recibo inequívoco de la decisión.

El detector encontró un solo aviso en `src/features/inventory/components/adjust-product-stock-modal.tsx:271`: `text-[11px]` en “Motivo (opcional)” no pertenece a la escala tipográfica documentada. `src/components/modals/shared/modal-ui.tsx` quedó limpio. Es una inconsistencia menor y posiblemente intencional; no explica los problemas prioritarios.

No hubo overlays ni inspección automatizada del navegador porque el usuario prohibió Playwright. La evidencia visual fue suministrada mediante las dos capturas y se contrastó con el código y el detector CLI.

## Impresión general

“Ajustar existencias” ya guía bien la tarea: explica que se fija un total final, muestra el efecto en lenguaje natural y reduce el peso del motivo opcional. La confirmación es visualmente limpia y el CTA “Aplicar ajuste” es inequívoco, pero no alcanza el mismo nivel de seguridad contextual. El mayor salto de calidad vendrá de hacer que el segundo paso confirme producto, cambio y motivo sin exigir memoria.

## Lo que funciona

- La tríada Actual / Nuevo total / Diferencia y la frase “Aumentará de 3 a 6 (+3)” ofrecen doble codificación y eliminan cálculo mental.
- El contexto del negocio permanece visible en ambos pasos, respetando la frontera multi-negocio.
- El motivo opcional explica honestamente qué se registrará si queda vacío, y la confirmación muestra ese valor final.
- La densidad, separadores y jerarquía del primer modal producen un recorrido claro: contexto → cambio → consecuencia → motivo → revisión.

## Problemas prioritarios

### [P1] La confirmación no identifica el producto

**Por qué importa:** `Actual 3 → Nuevo 6` no permite verificar a qué producto pertenece el cambio. En ajustes consecutivos, esta omisión aumenta el riesgo de aprobar el SKU equivocado.

**Solución:** colocar descripción y código del producto al inicio del resumen de confirmación. Mantener el negocio como frontera general y el producto como objeto inmediato de la acción. El estado “Activo” puede omitirse aquí si no cambia la decisión.

**Comando sugerido:** `$impeccable layout`.

### [P1] El conflicto de existencias descarta el trabajo

**Por qué importa:** si otra operación cambia el stock, el código cierra ambos diálogos y elimina el total propuesto y el motivo. El operador pierde contexto y debe reconstruir el ajuste.

**Solución:** conservar el borrador, volver al primer paso y mostrar una alerta inline con el stock actualizado. Recalcular la diferencia y ofrecer “Revisar con el nuevo valor”.

**Comando sugerido:** `$impeccable harden`.

### [P2] “Cancelar” es ambiguo en la confirmación

**Por qué importa:** en el segundo paso, cancelar el diálogo conserva el formulario para editarlo. La etiqueta puede interpretarse como abandonar todo el ajuste.

**Solución:** usar “Volver a editar”. Mantener “Cancelar” en el primer modal, donde sí abandona la operación completa.

**Comando sugerido:** `$impeccable clarify`.

### [P2] Llegar a cero no recibe una advertencia específica

**Por qué importa:** “Reducirá de 3 a 0 (−3)” es correcto, pero no destaca que el producto quedará sin existencias, una condición operativa relevante.

**Solución:** cuando el nuevo total sea cero, mostrar “El producto quedará sin existencias” en el primer paso y repetirlo en la confirmación. Acompañar el color con texto.

**Comando sugerido:** `$impeccable harden`.

### [P3] El delta pierde continuidad visual al confirmar

**Por qué importa:** el primer paso usa un badge semántico; el segundo muestra `+3` como texto ordinario. La lectura inmediata se debilita entre pasos.

**Solución:** reutilizar el badge o una etiqueta verbal como “Aumenta +3” / “Reduce −3” dentro del resumen.

**Comando sugerido:** `$impeccable polish`.

## Carga cognitiva y recorrido emocional

La carga es baja: existe un único objetivo, los datos están agrupados y nunca aparecen más de dos acciones. Falla un punto del checklist: la confirmación exige recordar el producto del paso anterior.

El primer modal comienza con buen contexto, gana confianza mediante la respuesta viva y termina con una acción de revisión claramente nombrada. La confirmación debería ser el pico de seguridad, pero la ausencia del producto introduce una duda justo antes de “Aplicar ajuste”. El conflicto concurrente produce el peor final posible: informa el problema, pero elimina el trabajo.

## Alertas por persona

**Alex, operador experto:** el autofoco ayuda y el recorrido es compacto. Sin embargo, un conflicto obliga a empezar de nuevo y la confirmación no protege suficientemente contra confundir productos durante una secuencia de ajustes.

**Jordan, primer uso:** entiende qué significa “Nuevo total”, pero puede interpretar “Cancelar” en el segundo paso como descarte completo. Tampoco puede verificar el producto sin volver mentalmente a la pantalla anterior.

**Sam, usuario de teclado o lector de pantalla:** el estado vivo de aumento o reducción es un acierto. La confirmación anuncia cifras y motivo, pero omite el producto afectado; esa pérdida de contexto es especialmente costosa en navegación lineal.

## Observaciones menores

- El badge “Activo” tiene valor limitado si el estado no modifica la posibilidad o el riesgo del ajuste.
- Un motivo cercano a 240 caracteres puede aumentar notablemente la altura de la confirmación; el contenido tiene scroll, aunque el pie no es persistente.
- La frase de auditoría aparece en ambos pasos. En la confirmación puede abreviarse si el espacio se usa para identificar producto y resultado.
- La etiqueta de 11 px es el único hallazgo automatizado; alinearla con un tamaño documentado mejoraría consistencia, pero no es prioritaria.

## Preguntas para decidir el siguiente paso

1. ¿La confirmación debe mostrar solo descripción y código, o también el estado Activo/Inactivo?
2. ¿Al llevar el stock a cero prefieres una advertencia inline o una confirmación visualmente más severa?
3. ¿Quieres resolver primero el contexto de confirmación, la recuperación por conflicto o ambos P1 juntos?
