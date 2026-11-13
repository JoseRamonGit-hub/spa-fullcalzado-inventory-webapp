-- ============================================================================
-- TEST SUITE: attach_cashea_order
-- Asociar una Orden Cashea a una Venta existente (REQ-011).
-- Requires the deterministic local seed.
-- ============================================================================

BEGIN;

SELECT plan(20);

SELECT set_config('test.today', ((now() AT TIME ZONE 'America/Caracas')::date)::text, true);
SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES
  ('3b000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ATTACH-01', 'Producto para asociar Cashea 1', 20, 50, true),
  ('3b000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'ATTACH-02', 'Producto para asociar Cashea 2', 20, 30, true),
  ('3b000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'ATTACH-03', 'Producto para asociar Cashea Estilos', 20, 50, true);

-- Venta de ayer en Calzado, con su día ya cerrado.
INSERT INTO public.sales (id, business_id, user_id, date)
VALUES (
  '3b000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  current_setting('test.today')::date - 1
);

INSERT INTO public.transactions (business_id, sale_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date)
VALUES
  (
    '10000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000101',
    '3b000000-0000-0000-0000-000000000001', 1, 50, 4250, 85,
    'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1
  ),
  (
    '10000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000101',
    '3b000000-0000-0000-0000-000000000002', 1, 30, 2550, 85,
    'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1
  );

INSERT INTO public.cash_closes (business_id, date, total_usd, total_ves, exchange_rate, closed_by)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  current_setting('test.today')::date - 1,
  0, 0, 85,
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (business_id, date) DO NOTHING;

-- Venta de hoy en Estilos, otro negocio.
INSERT INTO public.sales (id, business_id, user_id, date)
VALUES (
  '3b000000-0000-0000-0000-000000000201',
  '10000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000004',
  current_setting('test.today')::date
);

INSERT INTO public.transactions (business_id, sale_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id)
VALUES (
  '10000000-0000-0000-0000-000000000002', '3b000000-0000-0000-0000-000000000201',
  '3b000000-0000-0000-0000-000000000003', 1, 50, 4500, 90,
  'a0000000-0000-0000-0000-000000000004'
);

SELECT set_config('app.suppress_log_entry', 'false', true);

CREATE TEMP TABLE closed_day ON COMMIT DROP AS
SELECT *
FROM public.cash_closes
WHERE business_id = '10000000-0000-0000-0000-000000000001'
  AND date = current_setting('test.today')::date - 1;

GRANT SELECT ON closed_day TO authenticated;

-- ─── Permisos de la función ─────────────────────────────────────────────────

SELECT ok(
  NOT has_function_privilege('anon', 'public.attach_cashea_order(uuid,uuid,jsonb)', 'EXECUTE'),
  'anon no puede ejecutar attach_cashea_order'
);

-- ─── Empleado asocia a una venta de hoy ─────────────────────────────────────

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT set_config(
  'test.today_sale_id',
  public.create_sale(
    '10000000-0000-0000-0000-000000000001',
    '[{"product_id":"3b000000-0000-0000-0000-000000000001","quantity":2,"price_usd":50,"price_ves":4500}]'::jsonb,
    90
  )::text,
  true
);

SELECT set_config(
  'test.small_sale_id',
  public.create_sale(
    '10000000-0000-0000-0000-000000000001',
    '[{"product_id":"3b000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
    90
  )::text,
  true
);

SELECT set_config(
  'test.today_receivable_before',
  (SELECT cashea_receivable_usd::text FROM public.get_cash_close_summary('10000000-0000-0000-0000-000000000001')),
  true
);

SELECT set_config(
  'test.today_order_id',
  public.attach_cashea_order(
    '10000000-0000-0000-0000-000000000001',
    current_setting('test.today_sale_id')::uuid,
    '{"order_number":" 8001 ","invoice_number":" 552-0001 ","total_usd":100,"paid_today_usd":40,"financed_usd":60}'::jsonb
  )::text,
  true
);

SELECT results_eq(
  $$
    SELECT
      id::text,
      sale_id::text,
      sale_date,
      exchange_rate,
      order_number,
      invoice_number,
      total_usd,
      paid_today_usd,
      financed_usd,
      service_fee_pct,
      advance_fee_pct,
      expected_net_usd,
      status,
      created_by::text
    FROM public.cashea_orders
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
      AND order_number = '8001'
  $$,
  $$
    VALUES (
      current_setting('test.today_order_id'),
      current_setting('test.today_sale_id'),
      current_setting('test.today')::date,
      90.0000::numeric(12,4),
      '8001'::text,
      '552-0001'::text,
      100.00::numeric(12,2),
      40.00::numeric(12,2),
      60.00::numeric(12,2),
      4.00::numeric(5,2),
      4.00::numeric(5,2),
      53.60::numeric(12,2),
      'pending'::public.cashea_order_status,
      'a0000000-0000-0000-0000-000000000002'::text
    )
  $$,
  'El empleado asocia la orden a una venta de hoy y devuelve su id: tasa de la venta, porcentajes vigentes y Neto esperado'
);

SELECT is(
  (SELECT cashea_receivable_usd FROM public.get_cash_close_summary('10000000-0000-0000-0000-000000000001')),
  current_setting('test.today_receivable_before')::numeric + 60,
  'El resumen del día incluye lo financiado de la orden asociada'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.today_sale_id')::uuid,
      '{"order_number":"8002","invoice_number":"552-0002","total_usd":100,"paid_today_usd":40,"financed_usd":60}'::jsonb
    )
  $$,
  'P0001',
  'Esta venta ya tiene una Orden Cashea',
  'Una venta con orden no anulada no admite otra'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      '3b000000-0000-0000-0000-000000000101',
      '{"order_number":"8003","invoice_number":"552-0003","total_usd":80,"paid_today_usd":30,"financed_usd":50}'::jsonb
    )
  $$,
  'P0001',
  'Solo el Administrador puede asociar una Orden Cashea a una venta de otro día',
  'El empleado no asocia a una venta de un día anterior'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      '3b000000-0000-0000-0000-000000000201',
      '{"order_number":"8004","invoice_number":"552-0004","total_usd":50,"paid_today_usd":20,"financed_usd":30}'::jsonb
    )
  $$,
  'P0001',
  'Venta inexistente o perteneciente a otro negocio',
  'Una venta de otro negocio se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000002',
      '3b000000-0000-0000-0000-000000000201',
      '{"order_number":"8004","invoice_number":"552-0004","total_usd":50,"paid_today_usd":20,"financed_usd":30}'::jsonb
    )
  $$,
  'P0001',
  'Negocio inexistente, inactivo o no autorizado',
  'El empleado no asocia en un negocio sin acceso'
);

-- ─── Entradas inválidas ─────────────────────────────────────────────────────

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.small_sale_id')::uuid,
      null
    )
  $$,
  'P0001',
  'Los datos de la Orden Cashea son requeridos',
  'Sin datos de la Orden Cashea se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.small_sale_id')::uuid,
      '{"order_number":"8005","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'La Orden Cashea debe incluir número de orden, número de factura y montos válidos',
  'Falta uno de los cinco datos'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.small_sale_id')::uuid,
      '{"order_number":"8005","invoice_number":"552-0005","total_usd":30,"paid_today_usd":10,"financed_usd":15}'::jsonb
    )
  $$,
  'P0001',
  'Cobrado hoy más Monto financiado debe coincidir con el total de la Orden Cashea',
  'La suma de Cobrado hoy y Monto financiado debe coincidir con el total'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.small_sale_id')::uuid,
      '{"order_number":"8005","invoice_number":"552-0005","total_usd":31,"paid_today_usd":0,"financed_usd":31}'::jsonb
    )
  $$,
  'P0001',
  'El Monto financiado no puede superar el total de la Venta',
  'El Monto financiado no supera el total de la venta'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.small_sale_id')::uuid,
      '{"order_number":"8001","invoice_number":"552-0005","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'Ya existe una Orden Cashea con ese número en este negocio',
  'El número de orden no se repite entre las órdenes no anuladas del negocio'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.cashea_orders
    WHERE sale_id = current_setting('test.small_sale_id')::uuid
  ),
  0,
  'Los intentos rechazados no dejan órdenes'
);

-- ─── Tras anular la orden se puede asociar otra ─────────────────────────────

RESET ROLE;

UPDATE public.cashea_orders
SET status = 'voided',
    voided_at = now(),
    voided_by = 'a0000000-0000-0000-0000-000000000001',
    void_reason = 'registration_error',
    void_note = 'Prueba de reasociación'
WHERE id = current_setting('test.today_order_id')::uuid;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT lives_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.today_sale_id')::uuid,
      '{"order_number":"8001","invoice_number":"552-0006","total_usd":100,"paid_today_usd":50,"financed_usd":50}'::jsonb
    )
  $$,
  'Con la orden anterior anulada, la venta admite otra, incluso con el mismo número'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.cashea_orders
    WHERE sale_id = current_setting('test.today_sale_id')::uuid
      AND status <> 'voided'
  ),
  1,
  'La venta queda con una sola orden no anulada'
);

-- ─── Administrador asocia a cualquier fecha ─────────────────────────────────

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT set_config(
  'test.closed_receivable_before',
  (
    SELECT cashea_receivable_usd::text
    FROM public.get_cash_close_summary(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.today')::date - 1
    )
  ),
  true
);

SELECT lives_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      '3b000000-0000-0000-0000-000000000101',
      '{"order_number":"8007","invoice_number":"552-0007","total_usd":80,"paid_today_usd":30,"financed_usd":50}'::jsonb
    )
  $$,
  'El Administrador asocia a una venta de un día anterior'
);

SELECT results_eq(
  $$
    SELECT sale_date, exchange_rate, created_by::text
    FROM public.cashea_orders
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
      AND order_number = '8007'
  $$,
  $$
    VALUES (
      current_setting('test.today')::date - 1,
      85.0000::numeric(12,4),
      'a0000000-0000-0000-0000-000000000001'::text
    )
  $$,
  'La orden toma la fecha de la venta y la tasa de sus Renglones, no la vigente'
);

SELECT results_eq(
  $$
    SELECT to_jsonb(c)
    FROM public.cash_closes c
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
      AND date = current_setting('test.today')::date - 1
  $$,
  $$ SELECT to_jsonb(c) FROM closed_day c $$,
  'Asociar a un día ya cerrado no modifica su cierre guardado'
);

SELECT is(
  (
    SELECT cashea_receivable_usd
    FROM public.get_cash_close_summary(
      '10000000-0000-0000-0000-000000000001',
      current_setting('test.today')::date - 1
    )
  ),
  current_setting('test.closed_receivable_before')::numeric + 50,
  'El resumen en vivo del día cerrado refleja lo financiado de la orden asociada'
);

SELECT throws_ok(
  $$
    SELECT public.attach_cashea_order(
      '10000000-0000-0000-0000-000000000001',
      '3b000000-0000-0000-0000-000000000999',
      '{"order_number":"8008","invoice_number":"552-0008","total_usd":80,"paid_today_usd":30,"financed_usd":50}'::jsonb
    )
  $$,
  'P0001',
  'Venta inexistente o perteneciente a otro negocio',
  'Una venta inexistente se rechaza'
);

SELECT * FROM finish();
ROLLBACK;
