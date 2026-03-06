# 📄 Documentación de Arquitectura y Sistema: Spa Inventory Shoes

Esta documentación técnica describe exhaustivamente la arquitectura, estructura de datos, tecnologías, patrones de diseño y decisiones de UI/UX de la aplicación web "Plataforma de Gestión de Inventario y Control de Caja (Calzados)".

Esta guía está diseñada para que cualquier desarrollador o IA que retome el proyecto pueda comprender la totalidad y cabalidad del sistema, manteniendo la consistencia tecnológica y visual de la aplicación.

---

## 🏗️ 1. Arquitectura de Software y Estructura del Proyecto

El proyecto sigue una arquitectura modular inspirada en **Feature-Sliced Design (FSD)**, lo cual facilita la escalabilidad y el mantenimiento al agrupar la lógica por dominio de negocio (features) separada de la capa de componentes genéricos (UI) y los servicios de conexión a datos.

La estructura principal en `src/` es la siguiente:

- `components/`: Componentes UI reutilizables y genéricos (mayoritariamente componentes de shadcn/ui y componentes de layout puros).
- `features/`: Agrupación por dominios de la aplicación empresarial (`auth`, `inventory`, `cash-closes`, `movements`, `exchange_rates`). Cada feature expone sus propios componentes (ej. `product-form`, `products-table`), hooks específicos y utilidades.
- `services/`: Capa de abstracción de datos. Aquí se alojan los métodos que interactúan directamente con la base de datos (Supabase).
- `types/`: Definición global de tipos TypeScript, autogenerados desde Supabase e interfaces extendidas.
- `routes/`: Configuración del enrutamiento de la aplicación, utilizando un modelo de enrutamiento basado en archivos (File-based routing, `@tanstack/react-router`).
- `lib/`: Configuraciones de librerías de terceros (ej. inicialización del cliente de Supabase).

---

## 🛠️ 2. Stack Tecnológico

La aplicación es una Single Page Application (SPA) moderna, altamente interactiva y responsiva:

- **Frontend Core:** React 19 + TypeScript.
- **Build Tool:** Vite.
- **Enrutamiento:** TanStack Router (`@tanstack/react-router`). Permite un enrutamiento fuertemente tipado.
- **Manejo de Estado asíncrono y Caché:** TanStack Query (`@tanstack/react-query`). Utilizado para hacer fetching de datos desde los servicios y mantener la UI sincronizada.
- **Manejo de Formularios:** TanStack Form (`@tanstack/react-form`) junto a componentes no controlados o controlados de Radix UI.
- **Tablas:** TanStack Table (`@tanstack/react-table`) para data-grids complejas.
- **Manejo de Estado Global (Síncrono):** Zustand (ej. para preferencias, modales globales o estados de UI efímeros).
- **Estilos y UI:** TailwindCSS v4 + `shadcn/ui` + Radix UI + `vaul` (para drawers en móvil). Las clases modulares combinadas con `clsx` y `tailwind-merge` facilitan la creación de un sistema de diseño estricto.
- **Backend as a Service (BaaS):** Supabase (PostgreSQL, Auth y RLS).

---

## 🗄️ 3. Estructura de Datos (Base de Datos Supabase)

El backend expone las siguientes tablas relacionales críticas y _triggers_ para garantizar la integridad sin depender del cliente:

1. **`users`:** Integrado con Supabase Auth a través del trigger `handle_new_user()`. Administra los roles (`admin` y `employee`).
2. **`products`:** Catálogo de calzados. Contiene `code` (SKU), `description`, `stock`, y `price_usd`.
3. **`transactions`:** Registro de ventas. Contiene `product_id`, `quantity`, el precio origen (`price_usd`), el precio final cobrado (`price_ves`) y la tasa de cambio con la que se calculó (`exchange_rate`). El trigger `process_sale_transaction()` descuenta automáticamente el stock en `products` al insertar una venta.
4. **`inventory_movements`:** Registro inmutable tipo _log_ o _kardex_. Alimenta su data automáticamente con el trigger `log_product_entry()` cuando hay `INSERT` o `UPDATE` de stock en `products`, y con el de ventas para descontar.
5. **`exchange_rates` / `app_settings`:** Tablas para manejar la tasa de conversión (BCV o manual) como única fuente de la verdad para toda la app.
6. **`cash_closes`:** Cierres diarios de caja. Calculados por la Security Definer Function en la BD `generate_daily_cash_close()`, evitando matemáticas inconsistentes en el lado del cliente (frontend).

**Tipos TypeScript (`src/types/index.ts`):**  
Se derivan directamente del esquema genérico de Supabase. El frontend define tipos `Insert` y `Update` (`ProductInsert`, `ProductUpdate`), además de interfaces extendidas con _joined relations_ (Ej. `TransactionWithRelations` que empalma información del usuario y del producto usando Pick).

---

## ⚙️ 4. Servicios (Capa de Acceso a Datos)

Los servicios en `src/services/` encapsulan la lógica pura de Supabase. El Frontend NUNCA consume `supabase.from()` directamente en los componentes, siempre a través de estos servicios acoplados a TanStack Query (`useQuery` / `useMutation`).

- **`authService.ts`**: `login`, `logout`, `getSession`, `getCurrentUser`. Sincroniza el usuario de Supabase Auth con la tabla pública `users`.
- **`productsService.ts`**: CRUD estándar del catálogo (`getAll`, `getById`, `create`, `update`, `delete`).
- **`transactionsService.ts`**: Registro de salidas (Ventas).
- **`inventoryMovementsService.ts`**: Llamadas de solo lectura para poblar el Historial de movimientos.
- **`cashClosesService.ts`**: Ejecuta la función RPC (`generate_daily_cash_close`) para transaccionar y devolver el recibo final del día.
- **`exchangeRatesService.ts`**: Obtiene la tasa activa.

---

## 🎨 5. Decisiones de Diseño (UI/UX) y Patrones

La aplicación requiere un enfoque para _"uso general intensivo"_ y busca una apariencia visual premium, densa en información, altamente responsiva y moderna (Alejándose de plantillas CRM genéricas).

**Design System & Colores (`src/styles.css`):**

- **Oklch Color Space:** Todo el sistema de colores de Tailwind utiliza Oklch para asegurar paletas vibrantes que respeten la accesibilidad perceptual en claroscuros. Soporta de forma nativa Theming (Claro / Oscuro) usando la clase `.dark` (gestionado usualmente vía `next-themes`).
- **Paleta de Colores (Brand):**
  - _Primary_: Tono morado/índigo vibrante y acentuado (`oklch(0.55 0.2 270)`) en light mode.
  - _Background/Superficies_: En light mode se usa un fondo ultra-claro pero con un ligero tinte frío (`oklch(0.985 0.002 260)`), mientras que el dark mode es un "slate" profundo e inmersivo (`oklch(0.13 0.015 260)`), eliminando completamente el "negro pitch".
  - _Feedback Colors:_ Tonos de Éxito (`success`), Advertencia (`warning`) y Peligro (`destructive`) mapeados globalmente en variables CSS.
- **Tipografía:**
  - Letra principal: `Inter`, proporcionando alta legibilidad en interfaces de datos densas.
  - Tipografía Alternativa: `JetBrains Mono` o familias Mono para códigos de productos SKU (`.product-code`), y montos / valores usando `font-variant-numeric: tabular-nums` (`.tabular-nums`) para alinear de forma contable las cifras en todas las tablas.

**UX Patterns (Layout y Componentes):**

- **Sidebar & Bottom Bar Shell:** El cascarón de la app (`_app.tsx`) renderiza un Sidebar persistente y expandible en pantallas de escritorio y lo muta a un cómodo Bottom Navbar de acceso fluido en dispositivos móviles, lo que facilita que los vendedores operen sosteniendo un smartphone con una sola mano. Variables como `--topbar-height` y `--bottombar-height` gestionan los rebases dinámicamente.
- **Modales Responsivos Polymórficos (`vaul` + `radix`):** Los componentes de captura (Ej. ingresos de producto o ventas) no están en páginas aisladas. En escritorio se despliegan como un típico modal centrado flotante (`Dialog`). Si la pantalla < 768px (`isMobile`), este modal muta a un "Drawer" (Bottom Sheet arrastrable), mejorando enormemente la ergonomía en pulgar gracias a `vaul`.
- **Data Density y Tablas Interactivas:** Las data-tables (Cierres de caja `/cash-closes` o Inventario `/inventory`) priorizan métricas sin pads abultados. Son fáciles de escanear visualmente. La UI omite bordes de recuadro agresivos a favor de divisores semitransparentes (`10-20% opacity oklch bg`).
- **Glassmorphism:** Inputs flotantes y popovers utilizan transparencias suaves con blur en lugar de colores planos para modernizar la estética ("Mac-like"). Bordes como `--border: oklch(1 0 0 / 8%)` en formato hex rgba proveen acabados finos.
- **Micro Interacciones & Animaciones:** Incorporación de plugins como `tw-animate-css` para transiciones al navegar, entrar/salir de modales y submit state spinners.

---

## 🔌 6. Flujo General de Operaciones (Sinergia)

1. El usuario entra a la aplicación (Directorio `/`). Un guard de ruta del `TanStack Router` detecta si hay sesión local interceptando el BeforeLoad hook con `authService.getSession()`.
2. Si el rol es **`employee`** (Vendedor), es típicamente ruteado directo a la grilla/vista del inventario (`/inventory`).
3. En la página de inventario, el componente visual utiliza `useQuery` apuntando al closure del `productsService.getAll()`. La grilla se renderiza inmediatamente de la caché.
4. Para asentar una venta diaria, el empleado interactúa (clic) con una card o celda, disparando un Estado derivado (Zustand o State local) que invoca el **Modal Responsivo**.
5. Dicho Modal consume la tasa de cambio (`exchangeRatesService`), hace la matemática asincrónica instantánea del USD al VES (Bolívares), y al confirmar asienta una mutación a través de **TanStack Query**.
6. Esa mutación llama a `transactionsService.create()`. La Data Base (Postgres) procesa los Triggers prefabricados, loggeando permanentemente el Kardex y descontando de `products` de forma atómica.
7. Al cumplirse la promesa en el Frontend, las cachés críticas (`inventory`) se invalidan y el Router empuja el refresco automático a la tabla renderizada, evitando el f5 y dando impresión de software veloz con Single Source of Truth.
8. Al culminar el turno operativo, el **`admin`** ingresa a los Cierres de caja y presiona totalizar para disparar la Procedure de la base relacional, garantizando datos intachables y exactos.

---

_Documentación generada basados en el "Cotización de Desarrollo" y exploración minuciosa del código base actual por IA Assistant._
