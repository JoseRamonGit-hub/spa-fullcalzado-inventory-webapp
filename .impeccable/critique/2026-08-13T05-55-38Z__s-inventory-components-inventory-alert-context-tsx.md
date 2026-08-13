---
target: Nueva barra de alerta de Inventario con Stock bajo o Estancado activo
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-08-13T05-55-38Z
slug: s-inventory-components-inventory-alert-context-tsx
---
## Design Health Score

| # | Heurística | Puntuación | Problema clave |
|---|---|---:|---|
| 1 | Visibilidad del estado | 3/4 | Estado, carga y total son visibles; el cambio de prioridad tras ordenar no se anuncia como nuevo estado. |
| 2 | Correspondencia con el mundo real | 4/4 | La definición y el orden utilizan lenguaje operacional claro y específico. |
| 3 | Control y libertad | 3/4 | Quitar filtro y restablecer prioridad son reversibles; la acción de salida podría nombrar mejor su alcance. |
| 4 | Consistencia y estándares | 3/4 | Usa tokens y componentes del sistema, pero duplica el filtro activo entre select y badge. |
| 5 | Prevención de errores | 3/4 | Impide combinar fecha y alerta; la explicación se repite innecesariamente en dos lugares. |
| 6 | Reconocimiento antes que recuerdo | 3/4 | Definición y orden permanecen visibles; la jerarquía obliga a leer una frase completa para hallar la instrucción útil. |
| 7 | Flexibilidad y eficiencia | 3/4 | Permite ordenar y restablecer; no ofrece una transición rápida entre los dos tipos de alerta. |
| 8 | Diseño estético y minimalista | 2/4 | Badge, total, definición, prioridad, restricción de fecha y acciones compiten en una franja pequeña. |
| 9 | Diagnóstico y recuperación de errores | 2/4 | “Total no disponible” es honesto, pero no ofrece recuperación dentro de esta región. |
| 10 | Ayuda y documentación | 2/4 | La ayuda está presente, pero Estancado requiere divulgación progresiva en lugar de una definición permanente extensa. |
| **Total** |  | **28/40** | **Bueno: funcionalmente sólido, con jerarquía y densidad por resolver.** |

## Design Specificity Verdict

La barra es específica en contenido, pero genérica en composición. “Stock bajo”, “salidas comerciales”, “liquidación” y el orden de prioridad pertenecen al dominio de Full Calzado. Sin embargo, el patrón `badge + contador + párrafo auxiliar + acción ghost` podría pertenecer a cualquier tabla administrativa. La oportunidad es convertirla en una instrucción operativa, no en una explicación de configuración.

El detector determinista encontró 0 hallazgos en `inventory-alert-context.tsx`. Esto confirma que no hay anti-patrones sintácticos obvios, pero no invalida los problemas de redundancia, jerarquía y densidad observados en la captura.

No se generaron overlays ni se usó automatización de navegador. La evidencia visual provino de la captura suministrada y la evidencia estructural del código.

## Overall Impression

La barra hace el sistema más confiable: confirma el conjunto, explica la regla y permite salir. Su principal defecto es que intenta resolver demasiadas preguntas a la vez. En la captura, “2 productos” domina correctamente, pero la instrucción operativa —“menor stock primero”— queda incrustada en una línea secundaria junto a información repetida.

## Cognitive Load

La carga es moderada: fallan foco único, jerarquía y divulgación progresiva. No hay más de cuatro acciones disponibles, pero sí cinco piezas informativas concurrentes: tipo de alerta, cantidad, definición, prioridad y ausencia de fecha. En Estancado, la excepción de inactivos alarga todavía más la lectura. En móvil, esa explicación puede ocupar varias líneas antes de una tabla que ya necesita desplazamiento horizontal.

## Emotional Journey

Activar la alerta produce una buena sensación inicial de control: el usuario sabe que entró en una revisión dirigida y cuántos casos existen. Después, el mensaje pierde fuerza porque la señal de trabajo está tratada como metadato. La experiencia debería cerrar con una instrucción inmediata: `2 productos por revisar · Menor stock primero`, seguida de una salida inequívoca.

## What's Working

1. **Estado honesto:** distingue carga, total disponible, búsqueda parcial y error; no inventa cero productos.
2. **Prevención efectiva:** la fecha incompatible se elimina y queda deshabilitada con semántica nativa y explicación accesible.
3. **Reversibilidad correcta:** `Quitar filtro` está siempre disponible y `Restablecer prioridad` aparece solamente después de alterar el orden.

## Priority Issues

### [P1] La instrucción de trabajo queda subordinada al metadato

**Por qué importa:** el operador necesita saber qué atender y en qué orden. En la captura, el conteo destaca, pero `Prioridad: menor stock primero` queda enterrado en una oración secundaria.

**Arreglo:** construir una jerarquía de dos niveles: `2 productos por revisar` como encabezado y `Orden actual: menor stock primero` como soporte claramente identificable. La definición del filtro debe quedar como ayuda secundaria, no competir con el orden.

**Comando sugerido:** `$impeccable layout`

### [P1] La barra repite información que la topbar ya comunica

**Por qué importa:** el select ya muestra `Stock bajo` y el control de fecha ya está visiblemente deshabilitado. Repetir ambos consume el primer punto de atención de la barra sin añadir una decisión nueva.

**Arreglo:** asignar una responsabilidad a cada superficie: el select cambia el filtro; la barra explica el resultado y orienta el trabajo. Reemplazar badge y aviso de fecha por una formulación como `Revisión prioritaria · 2 productos`. Mantener la excepción de inactivos de Estancado mediante ayuda progresiva.

**Comando sugerido:** `$impeccable distill`

### [P1] Estancado será demasiado alto y verboso en ancho estrecho

**Por qué importa:** su definición larga, prioridad, ausencia de fecha y acciones pueden ocupar entre cuatro y seis líneas antes de la tabla. La barra termina compitiendo con el contenido que debe contextualizar.

**Arreglo:** mostrar permanentemente solo cantidad y orden. Convertir `Incluye inactivos para liquidación` en ayuda desplegable o tooltip accesible. Mantener la misma tabla móvil/escritorio; el problema está en la barra, no en la tabla.

**Comando sugerido:** `$impeccable adapt`

### [P2] “Quitar filtro” puede interpretarse como cerrar la franja

**Por qué importa:** el botón está lejos del selector y utiliza una X. Puede parecer que oculta el mensaje, no que vuelve a todo el inventario. Si existe una búsqueda, además solo elimina el estado de stock, no todos los filtros.

**Arreglo:** usar `Ver todo el inventario` o `Quitar filtro de stock`. El icono puede omitirse; el texto ya comunica la acción. En móvil debe permanecer cerca del resumen de estado.

**Comando sugerido:** `$impeccable clarify`

### [P2] El orden visual y el orden real pueden contradecirse

**Por qué importa:** tras ordenar otra columna aparece `Restablecer prioridad`, pero el texto continúa afirmando `Prioridad: menor stock primero`. La interfaz describe la política por defecto como si aún fuese el orden actual.

**Arreglo:** cuando exista orden personalizado, cambiar el copy a `Orden personalizado` y mostrar `Restablecer prioridad`. Al restablecer, volver a `Menor stock primero` o `Mayor tiempo sin salida primero`. Anunciar el cambio con una región viva concisa.

**Comando sugerido:** `$impeccable harden`

## Persona Red Flags

**Alex, usuario experto:** aprecia el orden y su restauración, pero la barra le obliga a leer explicaciones conocidas en cada visita. Cuando ordena manualmente, el copy que sigue diciendo “Prioridad” contradice la tabla y reduce confianza.

**Sam, teclado o lector de pantalla:** los botones nativos, labels y `aria-live` del conteo son una buena base. Sin embargo, el cambio a orden personalizado y su restauración no se anuncian. En zoom elevado, la explicación de Estancado y las acciones producen una franja alta antes del contenido principal.

**Riley, administrador metódico:** con búsqueda activa, `0 de 2 productos` necesita aclarar `0 encontrados de 2 en alerta`. Ante `Total no disponible`, no sabe si las filas visibles son parciales ni encuentra un reintento dentro de la franja.

## Minor Observations

- El fondo ámbar al 6% diferencia suavemente el contexto sin convertirlo en alarma; es apropiado para una herramienta operativa.
- Los botones `xs` tienen 24 px de alto. Encajan con la densidad de escritorio, pero en móvil quedan por debajo del objetivo táctil habitual de 44 px.
- El badge se parece a un estado, aunque el estado ya está expresado por el select. El conteo merece más protagonismo que el badge.
- `0 de 2 productos` es correcto pero menos claro que `0 encontrados de 2 en alerta`.
- El contraste parece razonable por tokens, pero no puede certificarse desde inspección estática; requiere medición sobre el render real.

## Questions to Consider

1. ¿La barra debe explicar permanentemente la definición del filtro o funcionar como una instrucción de trabajo para usuarios recurrentes?
2. ¿Prefieres que la acción de salida diga `Ver todo el inventario` o `Quitar filtro de stock`?
3. Cuando el usuario ordena manualmente, ¿la barra debe mostrar explícitamente `Orden personalizado`?
