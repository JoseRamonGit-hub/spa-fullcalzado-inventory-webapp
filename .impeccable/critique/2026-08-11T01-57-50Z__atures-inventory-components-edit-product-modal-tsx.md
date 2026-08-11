---
target: modal Editar Datos de Producto
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-11T01-57-50Z
slug: atures-inventory-components-edit-product-modal-tsx
---
# Crítica: modal «Editar datos del producto»

## Design Health Score

| # | Heurística | Puntuación | Hallazgo clave |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3 | Hay validación, confirmación y toast, pero el estado «sin cambios» solo se comunica después de pulsar una acción que parece válida. |
| 2 | Correspondencia sistema / mundo real | 4 | Código, descripción, precio y existencias usan lenguaje directo del negocio. |
| 3 | Control y libertad del usuario | 3 | Cancelar, cerrar y revisar antes de guardar ofrecen salidas claras; durante la mutación se bloquea el cierre correctamente. |
| 4 | Consistencia y estándares | 2 | La cabecera, identidad del producto y tratamiento del estado sin cambios divergen de «Ajustar existencias». |
| 5 | Prevención de errores | 3 | Límites, campos requeridos y confirmación previenen errores; falta impedir desde el formulario una revisión sin cambios. |
| 6 | Reconocimiento antes que recuerdo | 3 | El producto y sus valores actuales están visibles, aunque su jerarquía difiere entre modales vecinos. |
| 7 | Flexibilidad y eficiencia | 2 | El flujo es corto, pero no enfoca un campo ni ofrece una señal inmediata de qué cambió antes de abrir la confirmación. |
| 8 | Diseño estético y minimalista | 3 | Es limpio y compacto, pero la identidad inline truncada y el espacio residual bajo «Precio USD» debilitan la composición. |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 3 | Los validadores son concretos y preservan los datos; la ausencia de cambios se trata tarde mediante toast. |
| 10 | Ayuda y documentación | 3 | Las etiquetas y errores bastan para este operador experto; la descripción de cabecera no aporta valor operativo. |
| **Total** |  | **29/40** | **Bueno, con una inconsistencia visible entre modales del mismo flujo.** |

## Veredicto de especificidad

**Evaluación visual:** el modal pertenece al producto por su contexto de negocio activo, código monoespaciado, estado y paleta cálida. Sin embargo, todavía parece una versión anterior del lenguaje de mantenimiento: «Ajustar existencias» presenta descripción, código y estado como una ficha jerárquica, mientras «Editar» comprime código y descripción en una sola línea truncada. La diferencia parece accidental, no intencional.

**Escaneo determinista:** 0 hallazgos en `src/features/inventory/components/edit-product-modal.tsx`. El detector no identifica esta clase de divergencia entre componentes; no hubo falsos positivos.

**Evidencia visual:** se usó la captura aportada por el usuario y la lectura del código. No se ejecutó navegador por petición expresa del usuario; no existe overlay visible.

## Impresión general

El modal es funcional, seguro y compacto. Su mayor oportunidad no es añadir explicación, sino adoptar el mismo lenguaje operativo de «Ajustar existencias»: título sobrio, identidad vertical reconocible y estado de acción derivado de cambios reales.

## Qué funciona

- El negocio activo permanece visible y reduce el riesgo de editar datos en el contexto equivocado.
- La separación entre datos de catálogo y existencias está respaldada por servicios y confirmaciones distintas, aunque no necesita explicarse en la cabecera.
- La revisión previa muestra cada campo actual y nuevo, una protección proporcional para cambios administrativos.

## Problemas prioritarios

### [P1] La identidad del producto no sigue el patrón de «Ajustar existencias»

**Por qué importa:** en «Editar», código y descripción compiten en una sola línea y la descripción se trunca pronto. En «Ajustar», la descripción es la identidad principal y el código funciona como metadato debajo. Dos acciones vecinas obligan al operador a reaprender cómo reconocer el mismo producto.

**Corrección:** reemplazar la fila inline de `ModalProductIdentity` por la misma composición vertical de «Ajustar»: descripción en `text-sm font-medium`, código debajo con `product-code`, badge fijo a la derecha. Mantener el truncado con tooltip.

**Comando sugerido:** `$impeccable layout`.

### [P1] El botón «Revisar cambios» parece válido cuando no existe ningún cambio

**Por qué importa:** el operador puede avanzar hacia una acción nula y recibe la explicación tarde mediante toast. «Ajustar existencias» ya establece el estándar correcto: acción deshabilitada y consecuencia visible en el formulario.

**Corrección:** derivar `hasChanges` desde los valores del formulario, deshabilitar «Revisar cambios» mientras sea falso y, si hace falta una señal, usar una frase inline discreta; no depender del toast como respuesta principal.

**Comando sugerido:** `$impeccable harden`.

### [P2] La cabecera usa dos gramáticas visuales distintas

**Por qué importa:** «Editar» hereda título de 14 px, mayúsculas y tracking amplio; «Ajustar» usa 16 px, peso semibold y capitalización natural. También difieren padding de cabecera y pie. La familia de modales pierde previsibilidad.

**Corrección:** llevar estos valores al patrón compartido o aplicar en «Editar» las mismas clases de «Ajustar». La mejor solución de sistema es que `ResponsiveModal` tenga un único encabezado operativo predeterminado y que las excepciones sean raras.

**Comando sugerido:** `$impeccable polish`.

### [P2] `description` es obligatorio aunque no tiene función visible ni valor operativo

**Por qué importa:** ambos modales deben fabricar copy que `ResponsiveModal` oculta con `sr-only`. Esto crea una API engañosa y favorece divergencias de contenido invisibles. Según el criterio del producto, el operador ya comprende el contexto.

**Corrección:** hacer `description` opcional y omitirla en estos modales. Cuando no exista, no renderizar `DialogDescription` y configurar correctamente la relación accesible del diálogo para evitar advertencias de Radix. El título y las etiquetas del formulario deben cargar la comprensión.

**Comando sugerido:** `$impeccable distill`.

## Alertas por persona

**Alex (operador experto):** detecta enseguida que «Revisar cambios» está habilitado sin haber editado nada. El click y toast resultantes son fricción innecesaria en una tarea frecuente. También encuentra dos jerarquías distintas para reconocer el mismo producto.

**Sam (teclado/lector de pantalla):** la estructura de campos y el cierre son sólidos, pero retirar `DialogDescription` requiere ajustar explícitamente la semántica de Radix. No debe quedar una referencia `aria-describedby` vacía ni una advertencia de accesibilidad.

**Riley (casos límite):** una descripción de 120 caracteres queda severamente truncada en la identidad inline; el tooltip ayuda visualmente, pero el patrón vertical de «Ajustar» distribuye mejor esa presión. También probará el envío sin cambios y encontrará un camino aparentemente permitido que termina en toast.

## Observaciones menores

- «Precio USD» queda aislado en una segunda fila estrecha; es válido semánticamente, pero produce un bloque inferior visualmente débil en un modal ancho.
- El badge «Activo» está bien ubicado y debe conservarse como elemento estable entre ambos modales.
- La confirmación de edición sí usa una descripción visible y útil; esa explicación pertenece al momento de decisión, no a la cabecera inicial.

## Preguntas a considerar

- ¿Puede `ResponsiveModal` expresar una sola cabecera operativa para todo mantenimiento de producto, sin overrides por modal?
- ¿Qué información necesita realmente el operador antes de editar, si los propios campos ya muestran el estado actual?
- ¿Debe la acción primaria activarse únicamente después del primer cambio real, como ya ocurre en «Ajustar existencias»?

## Acciones recomendadas

1. **`$impeccable layout`**: alinear identidad, título, paddings y badge de «Editar» con «Ajustar existencias».
2. **`$impeccable harden`**: derivar `hasChanges` y bloquear la revisión nula con feedback local.
3. **`$impeccable distill`**: hacer opcional la descripción de `ResponsiveModal` y omitirla en los modales operativos que no la necesitan.
4. **`$impeccable polish`**: cerrar detalles de ritmo, ancho y comportamiento responsivo después de los cambios.
