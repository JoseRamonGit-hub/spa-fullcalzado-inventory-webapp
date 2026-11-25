# Inspiración de interfaz

De qué apps conocidas tomamos ideas y qué principios sacamos de ellas para Full Calzado. Este documento no sustituye a [DESIGN.md](../DESIGN.md). DESIGN.md define los tokens, la tipografía y la densidad. Aquí se explica **cómo ordenar una vista** para que sea fácil de usar. Si los dos documentos chocan, manda DESIGN.md.

## Referentes

No copiamos ninguna app. De cada una tomamos un patrón que ya resolvió un problema parecido al nuestro.

| Referente                                         | Qué tomamos                                                                                                                  | Problema que resuelve                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Ajustes del Sistema de macOS / Ajustes de iOS** | Grupos con título fuera y una tarjeta de filas dentro. Cada fila lleva la etiqueta a la izquierda y el control a la derecha. | Ver de un vistazo qué se puede configurar y dónde está cada cosa.                          |
| **Linear**                                        | Pocos elementos, descripciones cortas y una barra flotante cuando seleccionas filas.                                         | Quitar carga cognitiva. Actuar sobre varias filas sin que la tabla se mueva.               |
| **Vercel (panel de configuración)**               | Pie de tarjeta en un tono más apagado, con las opciones a la izquierda y Cancelar/Guardar a la derecha.                      | Que se note qué guarda cada botón y que la acción no se pierda en la página.               |
| **Stripe (Saldo, Pagos, detalle de pago)**        | Una cifra principal arriba, pestañas de filtro con contador y un panel lateral con el detalle y sus acciones.                | Saber cuánto hay sin sumar a mano, filtrar sin abrir menús y actuar sin salir de la lista. |
| **Mercury**                                       | Saldo grande con unos pocos datos de apoyo al lado.                                                                          | Responder primero la pregunta principal de la vista.                                       |
| **Gmail**                                         | Acciones masivas que aparecen solo cuando hay selección.                                                                     | Que la barra de acciones no ocupe sitio cuando no se usa.                                  |

## Principios

### 1. Lienzo cálido; tarjetas blancas solo para lo que se usa

El fondo de la vista es `bg-background`. Las tarjetas `bg-card` agrupan cosas con las que se interactúa: controles, filas que se pueden pulsar y formularios. La información de solo lectura que no forma un grupo (versión, autor, notas) va como texto suelto sobre el lienzo.

_Inspiración: macOS, Vercel._

### 2. Etiqueta a la izquierda, control a la derecha

Cada ajuste es una fila con la etiqueta y, si hace falta, una descripción corta (de 3 a 6 palabras) a la izquierda. El control o el valor va a la derecha. En móvil, una fila con un control ancho se apila. Para esto existen `SettingsGroup`, `SettingsRow` y `SettingsGroupFooter`.

_Inspiración: macOS, iOS._

### 3. Lo secundario, bajo demanda

Lo que se consulta poco (un historial, un detalle o un registro de cambios) se esconde detrás de un botón y se abre en un popover, un panel lateral o un diálogo. Solo se carga cuando se abre.

_Inspiración: Linear, Stripe._

### 4. Leer por defecto y desbloquear para editar

Hay valores que cambian poco y que, si se tocan por error, hacen daño: comisiones, tarifas o reglas de negocio. Esos se muestran como texto, junto a un candado. Al pulsar el candado aparecen los inputs y un pie con Cancelar/Guardar. Al guardar o cancelar, el bloque se vuelve a bloquear.

_Inspiración: el candado de Ajustes de macOS y el modo de edición de iOS._

### 5. Sin saltos de layout

Ningún texto aparece ni desaparece debajo de un control mientras el usuario escribe.

- Un error de validación se muestra solo con el input en rojo (`aria-invalid`, `hideErrorMessage`), sin mensaje escrito.
- No hay avisos dinámicos del tipo «Cambia −90 %».
- La confirmación o el fallo de una acción se comunica con un toast, que no empuja el contenido.
- Los skeletons ocupan el mismo tamaño que el contenido final.

_Inspiración: Linear, Stripe._

### 6. El botón principal se habilita solo si hay algo que guardar

Guardar está deshabilitado mientras el valor no cambia o no es válido. El formulario empieza con el valor actual, no vacío. Así no hace falta explicar nada: el botón habilitado ya indica que hay un cambio pendiente.

_Inspiración: Vercel, macOS._

### 7. Primero la respuesta principal

Si una vista responde una pregunta («¿cuánto me debe Cashea?»), esa respuesta va arriba como una cifra grande, con dos o tres datos de apoyo al lado. Nada de una fila de métricas en mayúsculas que pesan todas igual.

_Inspiración: Stripe Saldo, Mercury._

### 8. Filtros a la vista y con contador

Si un filtro tiene pocos estados (de 2 a 5), se usan pestañas con su contador («Pendientes 6 · Cobradas 3»), no un select. Una columna que repite el filtro activo en todas las filas se oculta.

_Inspiración: Stripe Pagos._

### 9. Las acciones donde se decide

Las acciones de un registro van a la vista en su panel de detalle, junto a los datos que hacen falta para decidir, no escondidas en un menú «⋯». La acción principal es el botón primario y la destructiva va aparte, a la izquierda.

_Inspiración: el detalle de pago de Stripe._

### 10. La selección masiva no mueve nada

Al seleccionar filas aparece una barra flotante abajo con el recuento, el total que importa y la acción. Nunca se inserta una barra encima de la tabla que la empuje hacia abajo.

_Inspiración: Linear, Gmail._

### 11. Menos ruido

- No hay avisos informativos que no piden ninguna acción («la tasa no se actualiza desde…»). Solo se avisa cuando algo está mal.
- No hay descripciones largas, tarjetas dentro de tarjetas ni iconos decorativos en cada fila.
- El color primario (bronce) se reserva para la acción principal y el estado activo.

_Inspiración: Linear y las reglas de DESIGN.md._

## Descartado

Son cosas que ya se probaron y no funcionaron en esta app:

- Volver al diseño anterior de Ajustes.
- Filas planas apiladas sin tarjetas: les faltaba estructura.
- Un título de sección a la izquierda con el contenido en una columna a la derecha.
- Un historial siempre visible.
- Avisos de antigüedad de un dato.
- Mensajes de error escritos y avisos que aparecen debajo de los inputs.

## Dónde se aplica

- **Ajustes** (`src/features/settings`): aplica los principios 1 a 6 y 11.
- **Cuentas por cobrar Cashea**: hay un prototipo que propone los principios 7 a 10, sin implementar. Si se lleva a la app, las tablas operativas mantienen la densidad de DESIGN.md (filas compactas). La tarjeta y el aire extra se reservan para Ajustes y para los paneles de detalle.

## Antes de entregar una vista nueva

- [ ] ¿Cuál es la pregunta principal de la vista y está respondida arriba?
- [ ] ¿Lo que es tarjeta blanca se puede usar, y lo de solo lectura va suelto?
- [ ] ¿Lo que se consulta poco está detrás de un botón?
- [ ] ¿Los valores sensibles están bloqueados por defecto?
- [ ] ¿Algo aparece o desaparece debajo de un control mientras escribo?
- [ ] ¿Guardar se habilita solo cuando hay un cambio válido?
- [ ] ¿Las acciones de un registro están a la vista en su detalle?
- [ ] ¿El bronce aparece solo en la acción principal?
