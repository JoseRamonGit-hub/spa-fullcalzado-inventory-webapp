---
target: vista Cierres de caja
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-11-18T12-01-44Z
slug: src-features-cash-closes
---
⚠️ DEGRADED: single-context (sub-agents not requested by the user; detector ran: 0 findings on src/features/cash-closes)

## Puntuación (Nielsen)

| # | Heurística | Nota | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | El estado del día está en 10 px; los días sin cierre no aparecen en el historial |
| 2 | Lenguaje del negocio | 3 | Se lee como un cuadre en papel; «Cashea anulado por devolución» con + no se entiende solo |
| 3 | Control y libertad | 3 | Cancelar, actualizar cierre, limpiar filtro: correcto |
| 4 | Consistencia | 3 | Misma tabla en panel y detalle; el historial muestra Devoluciones pero no Por cobrar Cashea |
| 5 | Prevención de errores | 3 | Confirmación con la cifra; detecta cierre desactualizado; días pasados no se cierran |
| 6 | Reconocer en vez de recordar | 2 | «Se cerró con $183.50» obliga a restar; «Último cierre: 16 nov.» obliga a contar días |
| 7 | Eficiencia | 2 | Filtro de un solo día, sin rango; sin atajo para cerrar |
| 8 | Diseño minimalista | 3 | Panel limpio; historial con ocho columnas del mismo peso |
| 9 | Recuperación de errores | 3 | Toast + diálogo abierto para reintentar; el panel con error no ofrece Reintentar |
| 10 | Ayuda | 2 | Sin explicación para el único concepto no obvio |
| | **Total** | **27/40** | **Aceptable, al borde de Bueno** |

## Veredicto
- Cuadre del día: carga baja. Responde «¿cuánto debe haber en caja y ya cerré?» sin cuentas mentales.
- Historial: carga moderada. Obliga a comparar, detectar huecos y reconstruir la cuenta de cada día en la cabeza.
- Checklist de carga cognitiva: 2 fallos (jerarquía del historial, memoria de trabajo) → moderada.

## Problemas por prioridad
- [P1] Días sin cierre invisibles en el historial. Fix: filas atenuadas «Sin cierre» o aviso con conteo; requiere regla de días no laborables.
- [P1] Total producido USD no es ancla: 5.ª columna, mismo peso, fuera de pantalla en móvil. Fix: moverla tras Fecha, en negrita (en ambos tamaños).
- [P2] El panel hace calcular: mostrar deltaUsd («+$45.00 desde el cierre de las 6:42 p. m.») y «Último cierre: ayer» con aviso si se saltó un día hábil.
- [P2] Cada fila del historial es media cuenta. Fix: Facturado − Devoluciones − Por cobrar Cashea = Producido; Cashea con monto + estado.
- [P3] Tooltip solo en «Cashea anulado por devolución».

## Personas
- Empleado al cierre: bien servido; el estado del día es demasiado discreto.
- Administrador auditando: no ve días sin cierre, ni cuánto quedó por cobrar a Cashea por día, sin abrir el detalle.
- Móvil: el cuadre cabe; en el historial la cifra clave queda fuera de la vista.

## Menores
- Error del panel sin Reintentar.
- Bs. pesa igual que USD en los renglones del cuadre.
- Nada anuncia que las filas abren el detalle.

## Preguntas
- ¿Qué días no abre la tienda?
- ¿El análisis por período vive en el Panel principal o aquí?
- ¿Bs. en el historial sirve más allá de referencia, si la tasa cambia cada día?
