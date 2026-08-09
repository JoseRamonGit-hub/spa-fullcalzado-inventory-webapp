# Verificación integrada multi-Negocio, móvil y accesible (#41)

Fecha: 2026-08-09  
Entorno ejecutado: SPA y Supabase locales  
Navegador: Chromium (Playwright), 1280×900 y 390×844

## Datos controlados

`supabase/seed.sql` deja disponibles los siguientes casos sin reconstruir historial desde el estado actual:

- María (`admin`) puede cambiar entre Full Calzado C.A. y Zapatería Estilos.
- Carlos (`employee`) sólo tiene acceso a Full Calzado C.A.
- Zapatería Estilos contiene una Venta de dos Renglones; el cierre registra una operación facturada.
- Full Calzado contiene dos cambios, una devolución y una venta histórica de OT-42, que queda inactivo después de venderse.
- SK-36 contiene 21 ediciones de precio auditadas y 25 eventos totales, suficientes para dos páginas de 20 filas.
- Hay productos con y sin actividad, activos, inactivo, sin stock y con stock bajo.

Credencial local de todos los usuarios del seed: `password123`.

## Resultado del recorrido local

| Área | Comprobación | Resultado |
| --- | --- | --- |
| Multi-Negocio | Cambiar Full → Estilos reemplaza KPIs, gráfico, Top y alertas sin mostrar valores de Full. | Pasa |
| Multi-Negocio | Cambiar de Negocio desde un detalle redirige a Dashboard y carga el nuevo contexto. | Pasa |
| Dashboard | Full y Estilos conservan métricas y cachés separadas. | Pasa |
| Gráfico | En 390 px el toque muestra el valor exacto; los mismos valores están expuestos como texto a tecnología asistiva. | Pasa |
| Inventario | En escritorio, clic o `Enter` sobre una fila abre el detalle directamente. | Pasa |
| Inventario | En móvil, la fila abre un drawer. Admin ve editar/activar-desactivar; employee sólo ve detalles. | Pasa |
| Detalle | Resumen e historial funcionan en escritorio y móvil; la tabla conserva Tipo, Fecha, Hora, Detalle, Cant., Stock y Usuario. | Pasa |
| Detalle | En 390 px la región horizontal midió 390 px visibles sobre 766 px y alcanzó `scrollLeft=376`. | Pasa |
| Historial | SK-36 muestra 20 filas en `Pág. 1/2` y 5 en `Pág. 2/2`; el resumen no cambia. | Pasa |
| Teclado | Fila, paginador, selector de período y acciones se operaron con foco, flechas y `Enter`. | Pasa |
| Ventas | Una Venta móvil con dos Renglones incrementó operaciones en uno, no en dos; también aceptó un producto inactivo. | Pasa |
| Devoluciones | Cambio y devolución se distinguen; Dashboard y Cierres separan facturación bruta, crédito devuelto y producido neto. | Pasa |
| Caché | Venta, devolución y cambio invalidan los consumidores relacionados; los valores se actualizaron sin recarga manual. | Pasa |
| Estados | Light/dark, escritorio/móvil, Negocio con actividad y sin actividad, loading, vacío y error recuperable mantienen la estructura. | Pasa |
| Errores | Se forzaron respuestas 503 en los cuatro recursos del Dashboard; cada bloque mostró `Reintentar` y recuperó sus datos independientemente. | Pasa |
| Accesibilidad | Los drawers de menú y operación exponen título y descripción; no emitieron advertencias al abrir/cerrar. | Pasa |

La venta móvil usada para comprobar invalidación modificó la base local. Después se reaplicó el seed final para verificar que la preparación es repetible incluso cuando existen operaciones creadas durante un recorrido anterior.

## Comprobaciones automatizadas

Ejecutar desde la raíz:

```bash
npm run lint
npm run build
npm run test:run
npm run test:db
```

Para validar el seed sin conservar sus cambios:

```bash
sed 's/^COMMIT;$/ROLLBACK;/' supabase/seed.sql \
  | docker exec -i supabase_db_spa-fullcalzado-inventory-webapp \
      psql -v ON_ERROR_STOP=1 -U postgres -d postgres
```

## Checklist después del despliegue

Producción no fue modificada ni recorrida durante esta validación local. Tras desplegar, registrar fecha, versión y capturas para:

1. Login de admin y employee.
2. Cambio de Negocio y ausencia de datos cruzados.
3. Filtros de Dashboard e historial con teclado y toque.
4. Acciones de inventario permitidas para cada rol.
5. Paginación del historial sin cambiar el resumen.
6. Light/dark y anchos de escritorio/móvil.
7. Degradados de loading, vacío y error recuperable.
8. Consistencia entre Dashboard, Ventas, Devoluciones y Cierres de Caja.
