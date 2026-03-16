---
description: Guía de Arquitectura y Refactorización de Módulos (Feature-Driven, HTML Semántico, React Bulletproof)
---

# Guía de Refactorización de Módulos

Esta guía establece el estándar arquitectónico y las mejores prácticas para crear, refactorizar y estructurar los módulos (features) en nuestra aplicación, asegurando escalabilidad bajo la estructura **Feature-Driven**, reglas de **Vercel Best Practices** y los principios de **Bulletproof React**.

## 1. Arquitectura Estructural (Feature-Driven)

Cada módulo o caso de uso debe estar encapsulado dentro de `src/features/[feature]/` garantizando una división limpia de responsabilidades. La estructura esperada es:

```text
src/features/[feature]/
├── components/          # Componentes de UI puros específicos de esta feature.
├── hooks/               # Centralización de Custom Hooks y llamadas API.
│   ├── use[Feature].ts  # Hook unificado con todas las queries/mutations.
│   └── use[Feature].test.tsx # Pruebas unitarias para las queries/mutations.
├── store/               # (Opcional) Estado global persistente local a esta feature (Zustand).
├── [view]/              # (Opcional) Sub-vistas locales (ej. subcarpetas como /login).
├── schemas.ts           # (Opcional) Esquemas de validación Zod.
├── columns.tsx          # (Opcional) Definición de celdas para TanStack Tables.
└── page.tsx             # Entry point (Página/Contenedor principal orquestador).
```

## 2. Refactorización de Hooks y Estado

Para el manejo del caché del servidor usando TanStack Query, seguimos patrones robustos:

- **Hook Centralizado (`use[Feature].ts`):** En lugar de fragmentar un dominio pequeño en diez archivos, agrupa todas las queries (`useQuery`) y mutaciones (`useMutation`) relacionadas a la entidad en un único archivo "Controller".
- **Query Key Factories:** Define siempre un diccionario en la parte superior del hook para manejar tus `queryKeys` (ej: `export const featureKeys = { all: ['feature'] as const, detail: (id) => [...featureKeys.all, id] }`). Nunca quemes strings a mano en la invalidación.
- **Tests Unitarios Exigidos:** Todo hook debe contar con un archivo de tests que garantice la simulación del QueryClient y compruebe **específicamente que las mutaciones disparan el `.invalidateQueries(...)` correcto** tras un resultado exitoso.

## 3. HTML Semántico, A11y y DOM Ligero

De acuerdo a las *Vercel Best Practices* se espera una alta calidad en la representación web al limpiar o escribir UI.

### Reducción del DOM ("Div Soup")
- Antes de envolver elementos con un `<div>` extra, verifica si es estrictamente funcional (ej. grid/flex de múltiples hijos). Si un `<div>` es meramente un puente para un estilo de espaciado o tipografía de un único hijo, transfiere la clase al propio hijo y destruye el contenedor padre.
- Combina contenedores: `<div><div>Contenido</div></div>` pasa a ser `<div className="combinados">Contenido</div>`.

### HTML Semántico Recomendado
Cambia los `divs` genéricos por contenedores que describan tu layout a los User Agents:
- `<main>`: Uso exclusivo para envolver la página raíz (`page.tsx`). Solo debe existir un contenedor `<main>` de cara al DOM a la vez, por ende no se debe usar a nivel de layouts padres genéricos que abarquen rutas hermanas sino localmente.
- `<header>`: Para envolver la barra de navegación del módulo, los títulos superiores de los bloques y formularios (topbars).
- `<section>`: Para dividir regiones funcionales masivas del layout.
- `<aside>`: Útil para paneles informativos decorativos o secciones apartadas de la funcionalidad núcleo del usuario.
- `<footer>` / `<small>`: Para cerrar cartas, mostrar *copyrights* o notas secundarias (footnotes).
- `<fieldset>` / `<legend>`: Utilizados para agrupar sistemáticamente matrices o conjuntos lógicos de Inputs dentro de los forms (ej. juntar controles "Precio" y "Stock" en un sub-grid form).

### Accesibilidad Simple
- **Atributo `aria-hidden="true"`:** Agrégalo firmemente a todos los `divs` decorativos, divisores visuales, íconos de color sólido e imágenes fondo. Esto informa a los Screen Readers omitir lecturas inútiles ayudando a navegar la página de forma limpia.
