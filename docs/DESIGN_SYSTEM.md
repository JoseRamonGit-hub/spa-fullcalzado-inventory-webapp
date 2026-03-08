# Full Calzado - Guía de Diseño y UI/UX para IAs

Este documento contiene las reglas de diseño, decisiones arquitectónicas de UI y la paleta de colores del proyecto **Full Calzado** (anteriormente ShoeStock). **Cualquier IA o desarrollador que trabaje en este proyecto DEBE leer y respetar estas directrices** para mantener la coherencia visual y la calidad premium de la aplicación.

## 1. Filosofía de Diseño

El objetivo principal de la interfaz es alejarse del "Síndrome Shadcn por defecto" (exceso de fondos blancos planos y colores genéricos). La aplicación debe sentirse **elegante, comercial, premium y con una clara jerarquía visual**, orientada al sector retail/calzado.

- **Profundidad y Elevación:** La app tiene un fondo base "crema cálido". Todas las áreas de contenido, formularios e inputs deben flotar sobre este fondo utilizando superficies elevadas (blancas/bg-card) y sombras sutiles.
- **Dark Frame Pattern:** La navegación (Sidebar en desktop, Bottom Bar en mobile, panel de login) utiliza un marco oscuro ("Dark Espresso") para contener visualmente el contenido claro y darle un aspecto más sofisticado.

## 2. Paleta de Colores: "Rich Amber & Warm Espresso"

El proyecto utiliza Tailwind CSS con variables definidas en `src/styles.css`.

| Semántica                             | Color / Valor                              | Uso                                                                                         |
| :------------------------------------ | :----------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Fondo Base (`bg-background`)**      | Crema Cálido (`oklch(0.965 0.007 75)`)     | Fondo general de la app (fuera de las tarjetas y áreas de contenido).                       |
| **Superficie (`bg-card`)**            | Blanco roto (`oklch(0.995 0.003 75)`)      | Contenedores de contenido, inputs, modales, tarjetas. Crea contraste contra el fondo crema. |
| **Primario (`bg-primary`)**           | Ámbar Rico (`oklch(0.50 0.145 52)`)        | Botones principales, acentos, marca. Transmite lujo y artesanía.                            |
| **Sidebar/Navegación (`bg-sidebar`)** | Espresso Oscuro (`oklch(0.17 0.015 55)`)   | Fondo del Sidebar, Bottom Bar y panel izquierdo del Login.                                  |
| **Bordes (`border-border`)**          | Gris Cálido Suave (`oklch(0.92 0.006 75)`) | Separadores sutiles y elegantes.                                                            |

> **Nota para IAs:** Nunca uses colores primarios genéricos como el azul por defecto de Tailwind o shadcn. Utiliza siempre la variable `--primary` o sus clases derivadas.

## 3. Guía de Componentes y Casos de Uso Especiales

### Layouts y Superficies

Para evitar páginas planas, el contenido principal debe estar envuelto en contenedores con fondo blanco. En el caso del layout principal (`_app.tsx`), el `SidebarInset` tiene aplicadas las clases `bg-card shadow-sm` para lograr esto.

### Formularios (Inputs, Textareas, Selects)

Debido al fondo crema de la app, **los controles de formulario NO deben ser transparentes** (`bg-transparent`). Deben forzar un fondo blanco para el contraste.

- **Regla:** Usa `bg-card` en los inputs.
- Ejemplo: `className="... bg-card border-input ..."`

### Tablas y Data Display

Las tablas usan un efecto de "Zebra Striping" (filas alternas) para facilitar la lectura de inventarios densos.

- **Zebra Stripe:** Las filas impares usan la clase `bg-table-stripe` (`oklch(0.95 0.008 75)`).
- **Hover:** Al pasar el cursor, se usa `hover:bg-table-hover` (`oklch(0.935 0.018 55)`).
- **Truncación:** Las columnas de descripción DEBEN usar `truncate max-w-[180px] md:max-w-[280px] block` para evitar que las filas crezcan en altura.

### Loading States (Skeletons)

Se utilizan skeletons enterprise-level que no causan layout shift:

- **`<TableSkeleton>`** (`table-skeleton.tsx`): Acepta `columnCount` y `rowCount`. Renderiza filas skeleton con la **misma altura compacta** que las filas reales (`py-1 px-2.5`). Varía el ancho de los skeletons por columna para simular datos reales.
- **`<MetricsSkeleton>`** (`metrics-skeleton.tsx`): Acepta `count`. Renderiza el layout de métricas con skeletons para label + value.
- **`DataTable`** acepta `isLoading` prop: cuando es `true`, renderiza headers estáticos reales + `<TableSkeleton>` en el `<tbody>`.

### Badges (Etiquetas)

Se abandonó el estilo de fondo sólido por defecto. Los Badges ahora tienen un estilo **"Soft UI"** con esquinas ligeramente más cuadradas (`rounded-md`).

- **Regla:** Usa fondos con opacidad baja (12%-15%) y el texto del mismo color pero saturado.
- Variantes disponibles: `default` (ámbar), `success` (verde para 'Activo' o 'Entrada'), `warning`, `destructive` (rojo para 'Salida'), `secondary` (gris para 'Inactivo').

### Botones de Acción Flotantes (FAB)

El botón principal de acción (ej. en la Bottom Bar móvil) debe destacarse drásticamente.

- **Regla:** Utiliza la clase de utilidad personalizada `.fab-glow` definida en `styles.css` para darle un aura pulsante luminosa acorde a su importancia.
- **Animación:** Se aplica `.fab-ping` como ring pulsante detrás del botón para atraer la atención.

### Modales Responsivos

- En **desktop**, los modales usan `Dialog` con padding `p-4`.
- En **mobile**, los modales se renderizan dentro de un `Drawer` con padding reducido (`px-4 py-2`) para maximizar el espacio del contenido.
- Formularios largos deben dividirse con `Tabs` o `Accordion` (ej. `IngresoModal` ya usa Tabs).

### Login Page

La página de login está diseñada como una "Split Screen". El lado de la marca tiene el fondo Espresso oscuro con degradados en tonos orquídea/ámbar, mientras que el formulario está sobre un fondo blanco (`bg-card`). Cuenta con cuentas demo accesibles con un click para agilizar pruebas.

## 4. Estilo de Código y Stack

- **Stack:** React, Vite, Tailwind CSS v4, shadcn/ui, TanStack Router.
- **Iconos:** Lucide React.
- **Estado:** Zustand (ej. `useAuthStore`, `useModalStore`).
- **Datos:** TanStack Query (`useQuery`, `useMutation`).

Cualquier nuevo componente que se genere con shadcn CLI (`npx shadcn@latest add ...`) DEBE ser revisado para asegurar que cumple con estas reglas de diseño, especialmente ajustando bordes y fondos (`bg-transparent` a `bg-card` donde aplique, ajustando radius a `rounded-xl`, etc).
