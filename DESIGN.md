---
version: alpha
name: Full Calzado — El Taller de Caja
description: Sistema operativo compacto, cálido y preciso para la gestión diaria de varias zapaterías.
colors:
  primary: "oklch(0.5 0.145 52)"
  primary-dark: "oklch(0.68 0.16 55)"
  primary-foreground: "oklch(0.99 0.002 75)"
  background: "oklch(0.965 0.007 75)"
  foreground: "oklch(0.15 0.02 55)"
  card: "oklch(0.995 0.003 75)"
  secondary: "oklch(0.945 0.01 75)"
  secondary-foreground: "oklch(0.26 0.02 55)"
  muted: "oklch(0.945 0.01 75)"
  muted-foreground: "oklch(0.46 0.02 55)"
  accent: "oklch(0.94 0.012 75)"
  accent-foreground: "oklch(0.26 0.02 55)"
  border: "oklch(0.88 0.01 75)"
  input: "oklch(0.85 0.012 75)"
  ring: "oklch(0.5 0.145 52)"
  sidebar: "oklch(0.17 0.015 55)"
  sidebar-foreground: "oklch(0.92 0.008 75)"
  sidebar-primary: "oklch(0.65 0.16 55)"
  sidebar-accent: "oklch(0.24 0.02 55)"
  destructive: "oklch(0.55 0.22 25)"
  success: "oklch(0.5 0.14 155)"
  warning: "oklch(0.7 0.16 80)"
  exchange: "oklch(0.52 0.14 240)"
  refund: "oklch(0.5 0.18 310)"
  edit: "oklch(0.5 0.08 65)"
  chart-teal: "oklch(0.55 0.12 185)"
  chart-magenta: "oklch(0.6 0.15 330)"
  chart-gold: "oklch(0.7 0.16 80)"
  chart-red: "oklch(0.58 0.2 25)"
  table-stripe: "oklch(0.975 0.004 75)"
  table-hover: "oklch(0.95 0.01 75)"
  background-dark: "oklch(0.13 0.015 55)"
  card-dark: "oklch(0.17 0.015 55)"
  foreground-dark: "oklch(0.93 0.006 75)"
  dark-muted: "oklch(0.22 0.015 55)"
  dark-muted-foreground: "oklch(0.66 0.015 75)"
  estilos-teal: "oklch(0.46 0.12 185)"
  estilos-green: "oklch(0.66 0.14 165)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: '"cv02", "cv03", "cv04", "cv11"'
  body-small:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.05em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.03em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "20px"
  4xl: "24px"
  full: "9999px"
spacing:
  hairline: "2px"
  xs: "4px"
  sm: "8px"
  compact: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "32px"
  input-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  badge-status:
    backgroundColor: "oklch(0.5 0.145 52 / 12%)"
    textColor: "{colors.primary}"
    typography: "{typography.body-small}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  navigation-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px"
  mobile-primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    size: "56px"
---

# Design System: Full Calzado — El Taller de Caja

## Overview

**Creative North Star: "El Taller de Caja"**

El sistema se comporta como un puesto de trabajo bien dispuesto: cada herramienta está cerca, cada dato tiene un lugar y la calidez material del comercio evita que la precisión se sienta clínica. Su carácter es **sobrio, cálido y preciso**. El bronce, el lienzo crema y el marco cacao evocan cuero, oficio y mostrador sin convertir la aplicación en una pieza decorativa.

La densidad es deliberadamente compacta porque empleados y administradores operan durante una jornada real. El espacio sirve para separar funciones, no para inflar la interfaz. La jerarquía nace de contraste tonal, bordes finos, tipografía medida y estados claros; la expresión de marca se concentra en acciones, datos clave y el marco de navegación.

**Key Characteristics:**

- Densidad compacta y ritmo de 4 px, con agrupaciones frecuentes de 8, 12 y 16 px.
- Lienzo cálido claro dentro de un marco de navegación carbón cacao.
- Bronce ámbar reservado para acción, selección y datos de alta importancia.
- Titulares geométricos, cuerpo neutral y cifras monoespaciadas.
- Bordes y capas tonales primero; sombras solo cuando una superficie realmente se eleva.
- Interacciones directas y estados semánticos inequívocos.

## Colors

La paleta une neutrales cálidos de baja cromaticidad con un bronce concentrado y colores semánticos suficientemente distintos para leer operaciones de un vistazo.

La implementación usa la arquitectura semántica de **shadcn/ui New York sobre Radix y Tailwind CSS 4**. `src/styles.css` centraliza `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar` y las extensiones de dominio. Los componentes consumen utilidades como `bg-primary`, `text-muted-foreground` y `border-border`; los nombres descriptivos de esta sección explican el carácter de esos tokens, pero no crean una paleta paralela ni autorizan valores crudos dentro de componentes.

### Primary

- **Bronce Ámbar** (`oklch(0.5 0.145 52)`; oscuro `oklch(0.68 0.16 55)`): acción principal, selección, foco, códigos de producto y cifras clave. En tema oscuro aumenta su luminosidad para conservar presencia y contraste.

### Secondary

- **Verde Estilos** (`oklch(0.46 0.12 185)`): identidad contextual de Zapatería Estilos C.A.; se limita al selector y a las señales del negocio activo.
- **Verde Balance** (`oklch(0.5 0.14 155)`): confirmaciones y estados positivos.
- **Oro Alerta** (`oklch(0.7 0.16 80)`): advertencias y condiciones que requieren atención sin implicar error.
- **Rojo Corrección** (`oklch(0.55 0.22 25)`): acciones destructivas, errores y pérdidas.
- **Azul Cotización** (`oklch(0.52 0.14 240)`), **Magenta Devolución** (`oklch(0.5 0.18 310)`) y **Sepia Edición** (`oklch(0.5 0.08 65)`): distinguen tipos de operación; no son acentos decorativos.

### Neutral

- **Lienzo Cálido** (`oklch(0.965 0.007 75)`): fondo general del tema claro.
- **Marfil de Mostrador** (`oklch(0.995 0.003 75)`): tarjetas, campos, popovers y superficies de trabajo.
- **Tinta Cálida** (`oklch(0.15 0.02 55)`): texto principal de máxima legibilidad.
- **Arena Apagada** (`oklch(0.945 0.01 75)`): controles secundarios, cabeceras y capas tonales discretas.
- **Cuero Pálido** (`oklch(0.88 0.01 75)`): bordes, divisores y estructura de baja intensidad.
- **Carbón Cacao** (`oklch(0.17 0.015 55)`): sidebar y barra inferior; forma el marco estable de la aplicación.
- **Lienzo Nocturno** (`oklch(0.13 0.015 55)`) y **Superficie Nocturna** (`oklch(0.17 0.015 55)`): fondo y capas del tema oscuro, acompañados por texto cálido claro (`oklch(0.93 0.006 75)`).

### Named Rules

**La Regla del Bronce Escaso.** El bronce señala acciones, selección o información prioritaria; no debe cubrir grandes superficies ni competir simultáneamente en muchos puntos de una pantalla.

**La Regla del Marco Oscuro.** El carbón cacao pertenece a la navegación persistente y al encuadre de la aplicación. No se repite como fondo arbitrario de tarjetas internas.

**La Regla Semántica.** Verde, oro, rojo, azul, magenta y sepia conservan su significado operativo; nunca se intercambian por variedad estética.

## Typography

**Display Font:** Plus Jakarta Sans (con `ui-sans-serif`, `system-ui`, `sans-serif` como respaldo)

**Body Font:** Inter (con `ui-sans-serif`, `system-ui`, `sans-serif` como respaldo)

**Data/Mono Font:** JetBrains Mono (con `ui-monospace`, SFMono-Regular, Menlo y Consolas como respaldo)

**Character:** Plus Jakarta Sans aporta geometría firme a títulos y métricas; Inter mantiene los flujos densos, las etiquetas compactas y el cuerpo neutral y legible; JetBrains Mono alinea códigos, tasas, importes y atajos. Las familias preferidas están declaradas en los tokens, pero el proyecto no incorpora archivos de fuente ni imports remotos: los respaldos del sistema son parte real del comportamiento actual.

### Hierarchy

- **Display** (700, `1.875rem`, 1.1): marca del acceso y mensajes excepcionales; no es una escala habitual dentro de las vistas operativas.
- **Headline** (700, `1.5rem`, 1): cifras principales, tasas y métricas de gran prioridad.
- **Title** (600, `1rem`, 1.25): títulos de módulos, secciones y tarjetas.
- **Body** (400–500, `0.875rem`, 1.5): contenido, acciones y formularios.
- **Body Small** (400–600, `0.75rem`, 1.4): apoyo, metadatos y controles compactos.
- **Label** (500, `0.6875rem`, 0.05em, mayúsculas): etiquetas compactas de formularios y agrupaciones operativas.
- **Data** (600–700, `0.8125rem`, 0.03em): códigos de producto, tasas, importes y valores tabulares.

### Named Rules

**La Regla del Dato Monoespaciado.** Usa la familia mono solo cuando la alineación o identificación precisa del valor mejora la lectura: códigos, moneda, tasas y atajos de teclado.

**La Regla de Jerarquía Corta.** Una vista operativa trabaja principalmente con Title, Body y Body Small. Display y Headline quedan reservados para marca o métricas, no para ampliar títulos rutinarios.

## Layout

El sistema usa una carcasa responsiva de altura completa. En escritorio, una sidebar oscura plegable enmarca un panel claro con topbar de 44 px; en móvil, la navegación migra a una barra inferior de 56 px y las acciones frecuentes se concentran en un botón flotante central y drawers. El contenido principal prioriza scroll interno y evita que la navegación persistente se desplace.

El ritmo base es de 4 px. Los controles y filas se agrupan normalmente con 8 px; los márgenes internos más comunes son 12 y 16 px; 24 px se reserva para tarjetas amplias, diálogos y separaciones mayores. El dashboard limita su lectura a 72 rem (`max-w-6xl`), mientras tablas y páginas de operación aprovechan el ancho disponible. Los breakpoints observados siguen Tailwind: `sm` 640 px, `md` 768 px, `lg` 1024 px y `xl` 1280 px.

Las tablas operativas usan filas de 30 px, celdas de 13 px y padding horizontal de 16 px. Las tablas compactas de modales, confirmaciones y detalles subordinados usan filas de 28 px, celdas de 12 px y padding horizontal de 12 px. Ambas densidades conservan su esquema mediante anchos mínimos y desplazamiento horizontal; las cabeceras y filtros deben permanecer próximos a los datos que gobiernan.

**La Regla Compacta por Defecto.** No introduzcas espacio vacío para aparentar lujo. Añade separación solo cuando aclare una agrupación, una jerarquía o un cambio de tarea.

**La Regla de Operación Cercana.** La acción primaria, el filtro y el resultado que afecta deben convivir en el mismo contexto visual sin obligar a recorrer la pantalla.

## Elevation & Depth

La filosofía es de **estratificación contenida**. El sistema es plano en reposo: fondos cálidos, superficies marfil, bordes finos y bandas tonales construyen la mayor parte de la jerarquía. Las sombras aparecen en tarjetas (`shadow-sm`), controles delineados (`shadow-xs`), popovers y diálogos (`shadow-md` a `shadow-xl`) o en elementos que físicamente flotan sobre la interfaz.

### Shadow Vocabulary

- **Control mínimo** (`shadow-xs`): borde óptico para inputs, selects y botones delineados.
- **Superficie estable** (`shadow-sm`): tarjetas, panel principal inset y selección de negocio activa.
- **Capa temporal** (`shadow-md`, `shadow-lg`, `shadow-xl`): popovers, tooltips, menús y modales.
- **Acción flotante móvil** (`0 6px 20px oklch(0.5 0.145 52 / 40%), 0 0 0 4px oklch(0.5 0.145 52 / 14%), inset 0 1px 0 oklch(1 0 0 / 15%)`): exclusividad del botón “Nuevo”; en oscuro usa el Bronce Ámbar elevado.
- **Negocio activo** (`0 10px 24px` con el color contextual al 24%): icono del selector y transición entre negocios.

### Named Rules

**La Regla de Estratificación Contenida.** Primero separa con tono y borde; usa sombra solo si el elemento está por encima del plano, es temporal o necesita una señal táctil extraordinaria.

**La Regla de Un Solo Flotante.** El resplandor multicapa pertenece únicamente a la acción primaria móvil. No se replica en tarjetas, métricas ni botones ordinarios.

## Shapes

La forma base es suavemente funcional. Los controles usan 6 px, los contenedores estructurales 8–12 px y las superficies más amplias pueden llegar a 16–24 px. Los bordes son finos y cálidos; las siluetas redondas completas se reservan para el FAB, indicadores puntuales, avatares y estados tipo píldora.

La progresión real parte de un radio base de 8 px: `sm` 4 px, `md` 6 px, `lg` 8 px, `xl` 12 px, `2xl` 16 px, `3xl` 20 px y `4xl` 24 px.

**La Regla del Radio Funcional.** El radio aumenta con el tamaño y la independencia de la superficie. No conviertas cada bloque compacto en una cápsula ni mezcles radios sin relación con su escala.

## Components

Los componentes son **compactos, claros y seguros**: estados visibles, objetivos táctiles razonables y muy poca ornamentación fuera de su función.

### Buttons

- **Shape:** rectángulo compacto de esquinas suaves (6 px); el FAB móvil es la excepción circular.
- **Primary:** Bronce Ámbar con texto marfil; altura estándar de 36 px y padding de 8 × 16 px. El hover reduce ligeramente la luminosidad mediante `primary/90`.
- **Outline:** fondo del lienzo, borde cálido y `shadow-xs`; al pasar el cursor adopta la capa Accent.
- **Secondary / Ghost / Link:** la jerarquía disminuye por tono, ausencia de fondo o subrayado; nunca por reducir tanto el contraste que el control deje de leerse.
- **Focus / Disabled:** anillo de 3 px al 50% del color de foco; los controles deshabilitados conservan forma y bajan a 50% de opacidad.

### Chips / Badges

- **Style:** 11 px semibold, padding de 2 × 10 px, radio de 6 px y superficie semántica al 12–15%.
- **State:** el texto conserva el color semántico pleno; advertencias usan foreground oscuro específico para mantener contraste sobre oro.

### Cards / Containers

- **Corner Style:** 12 px para la tarjeta canónica; 8 px para contenedores utilitarios y 16 px cuando una superficie amplia funciona como objeto independiente.
- **Background:** Marfil de Mostrador en claro y Superficie Nocturna en oscuro.
- **Shadow Strategy:** `shadow-sm` discreto; los bordes al 60% sostienen la separación incluso sin sombra.
- **Internal Padding:** 24 px en la tarjeta base, reducido explícitamente a 12–16 px en superficies operativas densas.

### Inputs / Fields

- **Style:** altura de 36 px, fondo de tarjeta, borde Input, radio de 6 px, padding horizontal de 12 px y `shadow-xs`.
- **Focus:** el borde cambia a Ring y aparece un anillo de 3 px al 50%.
- **Error / Disabled:** error en Rojo Corrección con anillo translúcido; disabled mantiene legibilidad con 50% de opacidad y cursor no disponible.

### Navigation

- **Desktop:** sidebar Carbón Cacao, rótulos de grupo de 10 px con tracking amplio e items de 32 px; el activo usa Cocoa Active y mayor peso.
- **Mobile:** barra inferior de 56 px con cinco posiciones; el activo combina Bronce Ámbar, trazo más firme y una línea superior de 2 px.
- **Actions:** el FAB central de 56 px abre las operaciones frecuentes; su resplandor y escala activa comunican prioridad táctil.

### Data Tables

- Cabecera sobre Arena Apagada con Label de 11 px, semibold, tracking de 0.05 em y mayúsculas; filas de 30 px, celdas de 13 px y separadores al 40%.
- Alterna un Table Stripe apenas tonal y usa Table Hover para rastrear filas sin introducir tarjetas por registro. El indicador neutro de orden permanece tenue hasta hover o foco; el orden activo conserva contraste completo.
- Los códigos de producto usan Bronce Ámbar y JetBrains Mono. Fechas, importes, tasas y cantidades usan el rol `data-value`: JetBrains Mono, cifras tabulares y tracking de 0.01 em; heredan el tamaño y el peso de su densidad y jerarquía contextual.
- Centraliza encabezados, celdas, paginación, estados, scroll y affordances de overflow en `DataTable` y `Table`; ningún módulo redefine por su cuenta la anatomía o densidad de una tabla operativa.
- `Table` y `DataTable` son la autoridad de las densidades `operational` y `compact`; skeletons, contenido y estados vacíos consumen el mismo contrato para evitar saltos de geometría.
- Usa rótulos completos y estables como `Cantidad`, `Precio USD` y `Bs.`. El texto largo puede truncarse si conserva acceso al contenido completo; códigos, monedas, cantidades y fechas no deben quebrarse.
- El contenedor con desplazamiento horizontal debe ser alcanzable por teclado, tener un nombre accesible y mostrar una sombra lateral mientras exista contenido fuera de la vista.

**La Regla de Paridad Tabular.** Las tablas operativas conservan en móvil el mismo esquema, orden de columnas y densidad que en escritorio. Las columnas vitales se recorren horizontalmente y solo una excepción explícita —como una confirmación o el drawer de inventario— puede adaptar su composición. La sombra de overflow es la primera señal de continuidad; no fijes columnas hasta que la evidencia demuestre que esa señal y el desplazamiento son insuficientes.

**La Regla de un Solo Momento.** Todo evento usa una única columna `Fecha y hora`, formateada con los helpers canónicos y ordenada por su timestamp original, no por el texto presentado. Las entidades de día operativo, como el cierre de caja, mantienen fecha sin hora.

**La Regla del Estado Honesto.** Distingue carga, vacío real, filtros sin coincidencias y error. Conserva los datos previos cuando falle una actualización, ofrece reintento en errores bloqueantes y representa relaciones o valores ausentes con un fallback explícito como `—`, nunca con una celda ambigua ni un cero inventado.

### Business Context

- El negocio activo combina iniciales, nombre y un punto o gradiente contextual.
- Full Calzado usa el gradiente Bronce Ámbar; Zapatería Estilos usa Verde Estilos.
- El acento contextual identifica la frontera de datos, pero no reemplaza los colores semánticos de estado.

## Do's and Don'ts

### Do:

- **Do** conserva la densidad compacta con una escala de 4 px y usa 8, 12 y 16 px como agrupaciones principales.
- **Do** mantiene el Carbón Cacao en navegación persistente y el Lienzo Cálido en el plano de trabajo.
- **Do** reserva Bronce Ámbar para acción, foco, selección y datos de alta prioridad.
- **Do** usa colores semánticos de forma estable y acompaña el color con texto, icono o etiqueta cuando el significado sea crítico.
- **Do** conserva objetivos táctiles importantes de 36–44 px y el FAB móvil de 56 px aunque la presentación sea densa.
- **Do** usa el tema oscuro como traducción tonal completa, no como inversión automática.
- **Do** conserva todas las columnas vitales de las tablas operativas en móvil y usa desplazamiento horizontal con sombra de continuidad.
- **Do** muestra los eventos en una sola columna `Fecha y hora`, ordenada por el timestamp original, y reserva la fecha sola para entidades de día operativo.
- **Do** distingue carga, vacío real, filtros sin coincidencias y error; ofrece reintento y muestra fallbacks explícitos cuando falten datos.

### Don't:

- **Don't** añadas espacio generoso sin una función clara; la aplicación es compacta por defecto.
- **Don't** conviertas el producto en un SaaS azul y frío ni en una vitrina de ecommerce juguetona.
- **Don't** cubras grandes superficies con Bronce Ámbar ni hagas competir varias acciones primarias.
- **Don't** uses sombras fuertes en superficies estáticas cuando un borde o cambio tonal sea suficiente.
- **Don't** introduzcas nuevas familias tipográficas o colores de acento sin actualizar primero esta autoridad.
- **Don't** uses color contextual del negocio como sustituto de éxito, advertencia, devolución o error.
- **Don't** conviertas tablas operativas en tarjetas móviles ni ocultes columnas para evitar el desplazamiento horizontal; limita las excepciones a composiciones explícitas como confirmaciones o el drawer de inventario.
- **Don't** fijes columnas antes de comprobar que la sombra de overflow y el desplazamiento horizontal son insuficientes.
- **Don't** dividas fecha y hora de un evento en columnas separadas ni formatees fechas, monedas o cantidades fuera de los helpers centrales.
