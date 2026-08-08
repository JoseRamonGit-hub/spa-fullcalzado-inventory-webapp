-- ==========================================================================
-- TEST SUITE: dashboard_sales_period
-- Presets, calendar comparisons and billed-operation aggregation.
-- Requires the deterministic local seed.
-- ==========================================================================

BEGIN;

SELECT plan(17);
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.products (
  id,
  business_id,
  code,
  description,
  stock,
  price_usd,
  active
)
VALUES (
  '37000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'DASH-PERIOD-01',
  'Producto para períodos del Dashboard',
  100,
  10,
  true
);

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES (
  '37000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '2024-03-25'
);

INSERT INTO public.returns (
  id,
  business_id,
  type,
  credit_usd,
  credit_ves,
  difference_usd,
  difference_ves,
  exchange_rate,
  user_id,
  date
)
VALUES (
  '37000000-0000-0000-0000-000000000020',
  '10000000-0000-0000-0000-000000000001',
  'exchange',
  10,
  900,
  15,
  1350,
  90,
  'a0000000-0000-0000-0000-000000000001',
  '2024-03-27'
);

INSERT INTO public.transactions (
  id,
  business_id,
  product_id,
  quantity,
  price_usd,
  price_ves,
  exchange_rate,
  user_id,
  date,
  sale_id,
  return_id
)
VALUES
  (
    '37000000-0000-0000-0000-000000000101',
    '10000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    2,
    10,
    900,
    90,
    'a0000000-0000-0000-0000-000000000001',
    '2024-03-25',
    '37000000-0000-0000-0000-000000000010',
    null
  ),
  (
    '37000000-0000-0000-0000-000000000102',
    '10000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    3,
    10,
    900,
    90,
    'a0000000-0000-0000-0000-000000000001',
    '2024-03-25',
    '37000000-0000-0000-0000-000000000010',
    null
  ),
  (
    '37000000-0000-0000-0000-000000000103',
    '10000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    1,
    15,
    1350,
    90,
    'a0000000-0000-0000-0000-000000000001',
    '2024-03-26',
    null,
    null
  ),
  (
    '37000000-0000-0000-0000-000000000104',
    '10000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    1,
    25,
    2250,
    90,
    'a0000000-0000-0000-0000-000000000001',
    '2024-03-27',
    null,
    '37000000-0000-0000-0000-000000000020'
  ),
  (
    '37000000-0000-0000-0000-000000000105',
    '10000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    1,
    45,
    4050,
    90,
    'a0000000-0000-0000-0000-000000000001',
    '2024-03-20',
    null,
    null
  ),
  (
    '37000000-0000-0000-0000-000000000106',
    '10000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    1,
    30,
    2700,
    90,
    'a0000000-0000-0000-0000-000000000001',
    '2024-02-29',
    null,
    null
  );

SELECT is(
  (SELECT current_start FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'week', '2024-03-27') LIMIT 1),
  '2024-03-25'::date,
  'La semana comienza el lunes'
);

SELECT is(
  (SELECT comparison_end FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'week', '2024-03-27') LIMIT 1),
  '2024-03-20'::date,
  'Una semana en curso compara los mismos días transcurridos'
);

SELECT is(
  (SELECT count(*)::integer FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'week', '2024-03-27')),
  7,
  'La semana siempre devuelve siete posiciones'
);

SELECT is(
  (SELECT count(*)::integer FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'week', '2024-03-27') WHERE NOT is_available),
  4,
  'Los días futuros se marcan como no disponibles'
);

SELECT results_eq(
  $$
    SELECT current_total_usd, current_operations, average_ticket_usd
    FROM private.get_dashboard_sales_period(
      '10000000-0000-0000-0000-000000000001',
      'week',
      '2024-03-27'
    )
    LIMIT 1
  $$,
  $$ VALUES (90::numeric, 3, 30::numeric) $$,
  'El total bruto agrupa la Venta, el Renglón heredado y el Cambio en tres operaciones'
);

SELECT results_eq(
  $$
    SELECT previous_total_usd, previous_operations
    FROM private.get_dashboard_sales_period(
      '10000000-0000-0000-0000-000000000001',
      'week',
      '2024-03-27'
    )
    LIMIT 1
  $$,
  $$ VALUES (45::numeric, 1) $$,
  'La comparación semanal usa solamente lunes a miércoles anteriores'
);

SELECT is(
  (SELECT comparison_start FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'today', '2024-03-27') LIMIT 1),
  '2024-03-26'::date,
  'Hoy se compara contra ayer'
);

SELECT is(
  (SELECT count(*)::integer FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'today', '2024-03-27')),
  1,
  'Hoy devuelve un resumen compacto de una posición'
);

SELECT results_eq(
  $$
    SELECT bucket_label
    FROM private.get_dashboard_sales_period(
      '10000000-0000-0000-0000-000000000001',
      'month',
      '2024-03-31'
    )
  $$,
  $$ VALUES ('1–7'::text), ('8–14'), ('15–21'), ('22–28'), ('29–31') $$,
  'Marzo se agrupa en los cinco intervalos calendario contratados'
);

SELECT is(
  (SELECT comparison_end FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'month', '2024-03-31') LIMIT 1),
  '2024-02-29'::date,
  'Un marzo bisiesto se compara hasta el último día disponible de febrero'
);

SELECT is(
  (SELECT comparison_end FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'month', '2023-03-31') LIMIT 1),
  '2023-02-28'::date,
  'Un mes anterior más corto limita la comparación en un año no bisiesto'
);

SELECT is(
  (SELECT previous_total_usd FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'month', '2024-03-31') LIMIT 1),
  30::numeric,
  'La comparación mensual incluye el día ordinal disponible del mes anterior'
);

SELECT is(
  (SELECT bucket_total_usd FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'month', '2024-03-31') WHERE bucket_label = '22–28'),
  90::numeric,
  'El intervalo 22–28 agrega los importes inclusivamente'
);

SELECT is(
  (SELECT average_ticket_usd FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'today', '2000-01-01') LIMIT 1),
  0::numeric,
  'El Ticket promedio es cero cuando no hay operaciones'
);

SELECT throws_ok(
  $$
    SELECT *
    FROM private.get_dashboard_sales_period(
      '10000000-0000-0000-0000-000000000001',
      'custom',
      '2024-03-27'
    )
  $$,
  'P0001',
  'Período de facturación inválido',
  'Un preset fuera del filtro contratado se rechaza'
);

SELECT is(
  (SELECT count(*)::integer FROM private.get_dashboard_sales_period('10000000-0000-0000-0000-000000000001', 'month', '2024-02-15')),
  5,
  'Febrero bisiesto conserva el intervalo 29'
);

SET LOCAL ROLE authenticated;

SELECT lives_ok(
  $$
    SELECT *
    FROM public.get_dashboard_sales_period(
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'El contrato público usa Esta semana por defecto para un usuario autenticado'
);

SELECT * FROM finish();

ROLLBACK;
