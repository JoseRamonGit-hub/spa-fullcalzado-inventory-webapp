---
target: modal Ajustar existencias
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-11T00-58-16Z
slug: nventory-components-adjust-product-stock-modal-tsx
---
## Salud de diseño

| # | Heurística | Nota | Hallazgo clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3 | La diferencia se actualiza en vivo, pero el CTA deshabilitado no explica qué falta. |
| 2 | Correspondencia con el mundo real | 4 | “Existencias”, “Nuevo total” e “historial” hablan el idioma operativo del negocio. |
| 3 | Control y libertad | 3 | Hay cancelar, cierre y confirmación; un conflicto de concurrencia cierra todo y pierde el borrador. |
| 4 | Consistencia y estándares | 4 | Modal, contexto del negocio, badges y confirmación siguen el sistema existente. |
| 5 | Prevención de errores | 3 | Impide negativos, decimales y envíos sin cambio; permite ajustes sin una razón útil. |
| 6 | Reconocer antes que recordar | 3 | Actual, nuevo total y diferencia conviven; el efecto depende demasiado de interpretar signo y color. |
| 7 | Flexibilidad y eficiencia | 3 | Autofoco y entrada directa; faltan motivos recurrentes o una señal clara del flujo por teclado. |
| 8 | Diseño estético y minimalista | 3 | Es compacto y ordenado, aunque el textarea pesa más que la explicación del riesgo. |
| 9 | Recuperación de errores | 2 | Si cambió el stock, se descarta el trabajo en vez de facilitar reconciliación. |
| 10 | Ayuda y documentación | 2 | La explicación principal está oculta visualmente y la ayuda disponible se limita a un tooltip. |
| **Total** | | **30/40** | **Bueno, con dos riesgos operativos importantes.** |

## Veredicto de especificidad

La interfaz sí está concebida para Full Calzado: muestra el negocio activo, identifica el producto por descripción y código, y convierte una modificación abstracta en el recorrido “Actual → Nuevo total → Diferencia”. No sería intercambiable sin cambios con un formulario SaaS genérico.

Su principal oportunidad de autoría está en el momento de control. La estructura visual es un formulario modal convencional y no convierte la auditoría del inventario en una parte protagonista del flujo: el motivo es opcional y la explicación “Corrige el total disponible. El ajuste quedará registrado en el historial.” existe como descripción accesible, pero no se muestra a la persona vidente.

El detector encontró un solo aviso: `design-system-font-size` en `src/features/inventory/components/adjust-product-stock-modal.tsx:251`, por el `text-[11px]` de “Motivo (opcional)”, fuera de la rampa documentada. Es válido como inconsistencia de sistema, pero de severidad práctica baja y no explica los problemas centrales de la captura. No hubo overlays: la inspección de navegador se omitió por la restricción explícita de no usar Playwright; la evidencia alternativa fue la captura suministrada, el código fuente y el detector CLI.

## Impresión general

El modal transmite orden, contexto y control aritmético. La mejor decisión es poner el stock actual, el nuevo total y la diferencia en una misma línea. La mayor oportunidad es alinear el nivel de trazabilidad y recuperación con el riesgo de alterar manualmente la verdad del inventario.

## Lo que funciona

- El negocio activo permanece visible dentro del diálogo. Esto protege la frontera multi-negocio sin introducir otro selector ni distraer de la tarea.
- El bloque “Actual / Nuevo total / Diferencia” evita cálculo mental y comunica que se está estableciendo un total final, no sumando una entrada.
- Los guardarraíles son proporcionales: solo acepta enteros no negativos, bloquea el envío sin cambios, pide confirmación y verifica concurrencia antes de escribir.

## Problemas prioritarios

### [P1] La auditoría es demasiado débil para una corrección manual

**Por qué importa:** `Motivo (opcional)` convierte un valor vacío en “Sin motivo indicado”. Un administrador puede saber quién hizo el cambio, pero no por qué se cambió la existencia, lo que reduce la utilidad del historial y facilita correcciones accidentales o difíciles de defender.

**Solución:** exigir motivo cuando el delta no sea cero o, preferiblemente, ofrecer motivos operativos frecuentes —“Conteo físico”, “Mercancía dañada”, “Error de registro”— y “Otro”, con texto obligatorio. La confirmación debe mostrar motivo, negocio y efecto del ajuste.

**Comando sugerido:** `$impeccable harden` o `$impeccable shape`.

### [P1] Un conflicto de concurrencia destruye la recuperación

**Por qué importa:** si otra operación cambia las existencias, el código cierra la confirmación y el modal, descartando total y motivo. El operador debe reabrir, recordar y volver a escribir sobre un dato que ya cambió.

**Solución:** conservar el borrador, regresar al primer paso y mostrar un aviso inline con el stock actualizado y la acción “Revisar con el nuevo valor”. El conflicto debe ser un estado recuperable, no una expulsión del flujo.

**Comando sugerido:** `$impeccable harden`.

### [P2] La intención y la consecuencia están ocultas visualmente

**Por qué importa:** la descripción del modal es solo para lectores de pantalla. En un primer uso, la persona vidente no recibe confirmación explícita de que introduce el total final ni de que la operación queda auditada. Además, al abrir, el botón primario parece inactivo sin explicar qué debe cambiar.

**Solución:** mostrar una línea breve bajo el título o el bloque numérico: “Indica el total final. El cambio quedará en el historial.” Cuando no haya diferencia, acompañar el estado con “Cambia el total para continuar”.

**Comando sugerido:** `$impeccable clarify`.

### [P2] La diferencia es exacta, pero exige interpretación

**Por qué importa:** `+2` o `−2` depende del signo y del color. Bajo presión, una cifra aislada no verbaliza si se aumentará o reducirá el stock, y obliga a reconstruir mentalmente la consecuencia.

**Solución:** mantener el badge como señal secundaria y añadir un estado textual vivo: “Aumentará de 3 a 5 (+2)” o “Reducirá de 5 a 3 (−2)”.

**Comando sugerido:** `$impeccable clarify` o `$impeccable layout`.

### [P3] El campo opcional domina la composición

**Por qué importa:** el textarea de 80 px ocupa más peso visual que la explicación de la operación. Esto eleva una nota opcional mientras minimiza la decisión principal.

**Solución:** después de introducir motivos predefinidos, revelar el campo libre solo al elegir “Otro”. Mantener la densidad compacta del sistema.

**Comando sugerido:** `$impeccable distill`.

## Carga cognitiva y recorrido emocional

La carga es baja: existe un único foco, tres datos agrupados, dos acciones y ninguna decisión con más de cuatro opciones. El flujo empieza bien orientado por negocio y producto, gana confianza mediante la diferencia en vivo y termina con una confirmación proporcional al riesgo. El valle aparece antes del CTA —deshabilitado sin explicación— y el peor final ocurre en el conflicto de concurrencia, cuando el sistema informa pero borra el trabajo.

## Alertas por persona

**Alex, operador experto:** el autofoco acelera la entrada, pero cada ajuste exige dos diálogos y escribir razones recurrentes desde cero. Motivos estándar reducirían fricción sin eliminar la confirmación.

**Jordan, primer uso:** “Nuevo total” es correcto, pero no ve la explicación general porque está oculta. Puede dudar si está sumando o fijando el total y por qué “Revisar ajuste” no está disponible al abrir.

**Sam, usuario de teclado o lector de pantalla:** el formulario etiquetado, el cierre y el `aria-live` del delta son buenos cimientos. El tooltip concentra información que debería estar asociada persistentemente al campo, y perder el borrador tras un conflicto impone un costo mayor en navegación lineal.

## Observaciones menores

- “Activo” compite ligeramente con el producto. Conviene mantenerlo solo si ajustar un producto inactivo tiene una regla o riesgo distinto.
- El límite de 240 caracteres no tiene contador visible; si se conserva el texto libre, el límite debe anticiparse.
- `text-[11px]` en la etiqueta se aparta de la rampa tipográfica documentada. Debe alinearse con `body-small` o con el token `label`, no conservar un tamaño aislado.
- La interfaz usa correctamente “existencias” y “nuevo total”; conviene mantener “total final” en toda microcopy futura.

## Preguntas para decidir el siguiente paso

1. ¿La trazabilidad debe ser estricta —motivo siempre obligatorio— o rápida —motivos predefinidos y “Otro”—?
2. ¿Quieres priorizar seguridad operativa (conflictos y borradores), claridad visual (microcopy y delta verbal) o resolver ambas en una sola pasada?
3. ¿El alcance debe cubrir solo los dos P1 o los cinco hallazgos del modal?
