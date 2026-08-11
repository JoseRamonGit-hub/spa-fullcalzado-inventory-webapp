# Refinamiento puntual — Toolbar de acciones en "Detalle de producto"

## Objetivo

Refinar únicamente la apariencia y jerarquía visual de los botones de acción ubicados en el header de la vista **Detalle de producto**.

Acciones actuales:

- `Editar`
- `Ajustar`
- `Desactivar`

La estructura general de la vista ya es correcta y **no debe rediseñarse**.

El problema actual es visual y semántico:

- `Editar` y `Ajustar` se perciben demasiado parecidos.
- Los tres labels utilizan un tratamiento oscuro muy similar.
- `Desactivar` utiliza un tratamiento amber/beige que comunica atención o warning, pero no una acción destructiva.
- La toolbar no expresa con suficiente claridad la jerarquía entre consultar/modificar existencias/desactivar.

---

# 1. Principio de jerarquía

Aplicar la siguiente semántica:

```text
Editar      → acción secundaria / neutral
Ajustar     → acción operacional relevante
Desactivar  → acción destructiva
```

Los tres botones deben conservar:

- misma altura;
- mismo border-radius;
- misma densidad;
- mismo padding horizontal;
- mismo tamaño de icono;
- mismo gap icono/texto.

La diferenciación debe venir principalmente de:

- color;
- foreground;
- background;
- border;
- semántica de cada acción.

No hacer un botón significativamente más grande que los demás.

---

# 2. Botón "Editar"

`Editar` debe mantenerse como una acción secundaria y neutral.

## Tratamiento esperado

Usar una variante visual sobria:

- fondo neutral o prácticamente transparente;
- borde sutil;
- texto neutral, ligeramente menos duro que negro puro;
- icono neutral;
- hover discreto.

Ejemplo conceptual con Tailwind:

```tsx
<Button
  variant="outline"
  className="
    text-foreground/80
    border-border
    bg-background
    hover:bg-muted/60
    hover:text-foreground
  "
>
  <Pencil className="size-4 text-muted-foreground" />
  Editar
</Button>
```

Adaptar a los componentes y variants reales existentes.

## No hacer

No utilizar:

- color destructive;
- amber;
- verde;
- violeta;
- un fondo sólido;
- un acento excesivo del negocio.

`Editar` no debe competir con `Ajustar`.

---

# 3. Botón "Ajustar"

`Ajustar` representa una acción operacional importante porque modifica existencias y genera movimiento/historial.

Debe tener más identidad visual que `Editar`, pero sin convertirse en un CTA sólido demasiado dominante.

## Tratamiento esperado

Usar el **color del negocio activo** en una variante suave.

En la captura actual el negocio activo utiliza teal, pero **no hardcodear teal** si la aplicación ya resuelve el color dinámicamente por negocio.

El botón debe usar:

- fondo tenue del color del negocio;
- borde tenue del color del negocio;
- texto con color del negocio;
- icono con color del negocio.

Ejemplo conceptual:

```tsx
<Button
  variant="outline"
  className="
    bg-primary/10
    border-primary/20
    text-primary
    hover:bg-primary/15
    hover:text-primary
  "
>
  <Settings2 className="size-4" />
  Ajustar
</Button>
```

Si `primary` no representa el color dinámico del negocio, utilizar el token/clase correspondiente al acento real del negocio activo.

## No hacer

No usar un botón sólido `primary`.

No aumentar tamaño o peso tipográfico frente a los demás.

La jerarquía debe ser perceptible pero contenida.

---

# 4. Botón "Desactivar"

`Desactivar` debe abandonar el tratamiento amber/beige actual.

El amber comunica:

```text
warning / atención
```

pero esta acción pertenece a:

```text
destructive / cambio de estado importante
```

## Tratamiento esperado

Utilizar una variante `destructive` suave/outline.

Preferencia:

- fondo destructive muy tenue;
- borde destructive tenue;
- texto destructive;
- icono destructive;
- hover ligeramente más intenso pero sin llegar a un botón rojo sólido.

Ejemplo conceptual:

```tsx
<Button
  variant="outline"
  className="
    bg-destructive/5
    border-destructive/20
    text-destructive
    hover:bg-destructive/10
    hover:text-destructive
  "
>
  <CirclePause className="size-4" />
  Desactivar
</Button>
```

Adaptar el icono al que ya utiliza la aplicación.

No cambiar la acción ni su comportamiento.

---

# 5. Sobre el color del texto

Evitar que los tres botones utilicen exactamente el mismo foreground oscuro.

La jerarquía debe quedar:

```text
Editar      → text-foreground/80 o equivalente neutral
Ajustar     → text-[color-negocio]
Desactivar  → text-destructive
```

Esto debe resolver la sensación actual de que los tres botones son acciones genéricas equivalentes.

---

# 6. Iconografía

Mantener los conceptos actuales:

```text
Editar      → Pencil
Ajustar     → icono de ajuste / sliders / settings
Desactivar  → pause / circle-pause / equivalente actual
```

No cambiar de librería de iconos.

Mantener:

- mismo tamaño;
- mismo stroke;
- misma alineación;
- mismo gap con el label.

Ejemplo:

```tsx
className="size-4"
```

o el tamaño equivalente ya estandarizado en la app.

---

# 7. Hover / pressed states

Mantener los estados de interacción coherentes con la jerarquía.

## Editar

```text
neutral → neutral ligeramente más visible
```

## Ajustar

```text
primary/10 → primary/15 o equivalente
```

## Desactivar

```text
destructive/5 → destructive/10
```

No introducir:

- sombras fuertes;
- scale animations;
- transform;
- glow;
- gradientes.

---

# 8. Focus visible

Mantener accesibilidad y focus states existentes.

Si el componente `Button` ya centraliza:

```text
focus-visible:ring
focus-visible:outline
```

no sobreescribirlos innecesariamente.

No eliminar indicadores de teclado.

---

# 9. Desactivar no significa eliminar

La acción se llama `Desactivar`, por lo tanto:

- conservar el copy `Desactivar`;
- no cambiarlo por `Eliminar`;
- no usar iconografía de papelera si el producto no se elimina realmente.

Usar un icono relacionado con:

- pause;
- power off;
- disable;
- circle pause;

según lo que ya exista en la aplicación.

---

# 10. Color dinámico por negocio

`Ajustar` debe seguir el color del negocio activo.

Ejemplo:

```text
Full Calzado C.A.         → naranja
Zapatería Estilos C...    → teal
```

No hardcodear:

```tsx
text-teal-600
bg-teal-50
```

si el sistema ya dispone de un token dinámico.

Preferir:

```tsx
text-primary
bg-primary/10
border-primary/20
```

o el sistema equivalente utilizado realmente por la aplicación.

---

# 11. Layout

No modificar la ubicación actual de la toolbar.

Debe continuar alineada a la derecha del header de la vista.

Mantener el orden:

```text
[ Editar ] [ Ajustar ] [ Desactivar ]
```

No mover acciones a:

- menú dropdown;
- kebab menu;
- otro drawer;
- segunda fila;
- footer;
- tabla.

---

# 12. Densidad

No aumentar la altura actual de la cabecera.

Los botones deben seguir siendo compactos y compatibles con el lenguaje operacional de la app.

Evitar:

- botones altos;
- padding excesivo;
- labels con font-semibold innecesario;
- icon containers internos adicionales.

---

# 13. Responsive

Respetar el comportamiento responsive existente.

No romper mobile/tablet.

Si actualmente estas acciones se transforman en otro patrón responsive, conservar esa lógica.

Este refinamiento está enfocado principalmente en desktop.

No introducir un nuevo patrón móvil como parte de este cambio.

---

# 14. No modificar

No realizar cambios en:

- nombre del producto;
- punto de color del negocio;
- botón de volver;
- resumen de producto;
- badges;
- `Sin salida comercial`;
- stock;
- precios;
- estado;
- última actividad;
- selector `Últimos 30 días`;
- tabla de historial;
- colores de Entrada/Salida/Ajuste;
- cantidades positivas/negativas;
- columnas;
- sidebar;
- topbar;
- lógica de negocio.

No realizar un rediseño estructural.

---

# 15. Resultado esperado

La toolbar debe sentirse aproximadamente así:

```text
[ ✎ Editar ]   [ ⚙ Ajustar ]   [ ⏸ Desactivar ]
   neutral        negocio          destructive
```

Semánticamente:

```text
Editar
→ acción secundaria

Ajustar
→ acción operacional con identidad del negocio

Desactivar
→ acción destructiva clara
```

Sin necesidad de cambiar tamaños o estructura.

---

# 16. Criterios de aceptación

La implementación se considera correcta cuando:

1. `Editar` deja de competir visualmente con `Ajustar`.
2. `Editar` utiliza tratamiento neutral.
3. `Ajustar` utiliza el color dinámico del negocio activo.
4. `Ajustar` usa una variante suave, no un botón sólido.
5. `Desactivar` deja de utilizar amber/beige.
6. `Desactivar` utiliza `destructive`.
7. El texto de los tres botones ya no utiliza exactamente el mismo tratamiento oscuro.
8. Los tres botones conservan misma geometría y densidad.
9. No se cambia la estructura del header.
10. No se modifica el resto de la vista.
11. No se hardcodea el color teal/naranja si ya existe un sistema dinámico por negocio.
12. La toolbar se percibe más clara semánticamente y más coherente con el lenguaje visual de la aplicación.
