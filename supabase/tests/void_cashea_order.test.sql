-- ============================================================================
-- TEST SUITE: void_cashea_order
-- Anular una Orden Cashea con motivo (REQ-007, D-14).
-- Usa negocios propios de la prueba para que los resúmenes no dependan del seed.
-- ============================================================================

BEGIN;

SELECT plan(16);

SELECT set_config('test.today', ((now() AT TIME ZONE 'America/Caracas')::date)::text, true);
SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.businesses (id, name, slug)
VALUES ('3c000000-0000-0000-0000-000000000001', 'Prueba anulación Cashea', 'prueba-anulacion-cashea');

INSERT INTO public.user_business_access (user_id, business_id)
VALUES ('a0000000-0000-0000-0000-000000000002', '3c000000-0000-0000-0000-000000000001');

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES ('3c000000-0000-0000-0000-000000000011', '3c000000-0000-0000-0000-000000000001', 'VOID-01', 'Producto para anular Cashea', 50, 100, true);

-- Lunes (ayer): Venta Cashea de $100, $40 cobrados hoy y $60 financiados.
INSERT INTO public.sales (id, business_id, user_id, date)
VALUES ('3c000000-0000-0000-0000-000000000101', '3c000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1);

INSERT INTO public.transactions (business_id, sale_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date)
VALUES (
  '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000101',
  '3c000000-0000-0000-0000-000000000011', 1, 100, 8000, 80,
  'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
)
VALUES (
  '3c000000-0000-0000-0000-000000000201', '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000101',
  current_setting('test.today')::date - 1, 80, 'VOID-MONDAY', 'F-301',
  100, 40, 60, 4, 4, 53.60, 'a0000000-0000-0000-0000-000000000002'
);

-- Otras dos ventas de ayer: una con su orden Cobrada y otra con su orden Pendiente.
INSERT INTO public.sales (id, business_id, user_id, date)
VALUES
  ('3c000000-0000-0000-0000-000000000102', '3c000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1),
  ('3c000000-0000-0000-0000-000000000103', '3c000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1);

INSERT INTO public.cashea_deposits (id, business_id, deposit_date, received_ves, expected_net_usd, created_by)
VALUES (
  '3c000000-0000-0000-0000-000000000401', '3c000000-0000-0000-0000-000000000001',
  current_setting('test.today')::date, 1500, 17.60, 'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, deposit_id, collected_at, created_by
)
VALUES
  (
    '3c000000-0000-0000-0000-000000000202', '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000102',
    current_setting('test.today')::date - 1, 80, 'VOID-COLLECTED', 'F-302',
    40, 20, 20, 4, 4, 17.60,
    'collected', '3c000000-0000-0000-0000-000000000401', now(), 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3c000000-0000-0000-0000-000000000203', '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000103',
    current_setting('test.today')::date - 1, 80, 'VOID-PENDING', 'F-303',
    50, 20, 30, 4, 4, 26.80,
    'pending', null, null, 'a0000000-0000-0000-0000-000000000002'
  );

-- ─── Ejemplo de REQ-007 (negocio 2) ─────────────────────────────────────────
-- Lunes (ayer): Venta Cashea de $100 ($40 cobrados hoy, $60 financiados).
-- Martes (hoy): $200 vendidos y la devolución de $100 de la venta del lunes.

INSERT INTO public.businesses (id, name, slug)
VALUES ('3c000000-0000-0000-0000-000000000002', 'Prueba REQ-007', 'prueba-req-007');

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES ('3c000000-0000-0000-0000-000000000012', '3c000000-0000-0000-0000-000000000002', 'VOID-02', 'Producto del ejemplo de REQ-007', 50, 100, true);

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES
  ('3c000000-0000-0000-0000-000000000111', '3c000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 1),
  ('3c000000-0000-0000-0000-000000000112', '3c000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date);

INSERT INTO public.transactions (business_id, sale_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date)
VALUES
  (
    '3c000000-0000-0000-0000-000000000002', '3c000000-0000-0000-0000-000000000111',
    '3c000000-0000-0000-0000-000000000012', 1, 100, 8000, 80,
    'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 1
  ),
  (
    '3c000000-0000-0000-0000-000000000002', '3c000000-0000-0000-0000-000000000112',
    '3c000000-0000-0000-0000-000000000012', 2, 100, 8000, 80,
    'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date
  );

INSERT INTO public.returns (business_id, type, credit_usd, credit_ves, difference_usd, difference_ves, exchange_rate, user_id, date)
VALUES (
  '3c000000-0000-0000-0000-000000000002', 'refund', 100, 8000, 0, 0, 80,
  'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
)
VALUES (
  '3c000000-0000-0000-0000-000000000211', '3c000000-0000-0000-0000-000000000002', '3c000000-0000-0000-0000-000000000111',
  current_setting('test.today')::date - 1, 80, 'REQ-007', 'F-311',
  100, 40, 60, 4, 4, 53.60, 'a0000000-0000-0000-0000-000000000001'
);

-- ─── Anulaciones el mismo día y en un día cerrado (negocio 3) ───────────────
-- Hoy: dos Ventas Cashea ($50 con $30 financiados y $40 con $25 financiados).
-- Ayer, ya cerrado: Venta Cashea de $80 con $50 financiados.

INSERT INTO public.businesses (id, name, slug)
VALUES ('3c000000-0000-0000-0000-000000000003', 'Prueba anulación en el día', 'prueba-anulacion-en-el-dia');

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES ('3c000000-0000-0000-0000-000000000013', '3c000000-0000-0000-0000-000000000003', 'VOID-03', 'Producto para anular en el día', 50, 10, true);

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES
  ('3c000000-0000-0000-0000-000000000121', '3c000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date),
  ('3c000000-0000-0000-0000-000000000122', '3c000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date),
  ('3c000000-0000-0000-0000-000000000123', '3c000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 1);

INSERT INTO public.transactions (business_id, sale_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date)
VALUES
  (
    '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000121',
    '3c000000-0000-0000-0000-000000000013', 5, 10, 800, 80,
    'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date
  ),
  (
    '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000122',
    '3c000000-0000-0000-0000-000000000013', 4, 10, 800, 80,
    'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date
  ),
  (
    '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000123',
    '3c000000-0000-0000-0000-000000000013', 8, 10, 800, 80,
    'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 1
  );

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
)
VALUES
  (
    '3c000000-0000-0000-0000-000000000221', '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000121',
    current_setting('test.today')::date, 80, 'SAME-DAY-ERROR', 'F-321',
    50, 20, 30, 4, 4, 26.80, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '3c000000-0000-0000-0000-000000000222', '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000122',
    current_setting('test.today')::date, 80, 'SAME-DAY-RETURN', 'F-322',
    40, 15, 25, 4, 4, 22.40, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '3c000000-0000-0000-0000-000000000223', '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000123',
    current_setting('test.today')::date - 1, 80, 'CLOSED-DAY-ERROR', 'F-323',
    80, 30, 50, 4, 4, 44.80, 'a0000000-0000-0000-0000-000000000001'
  );

INSERT INTO public.cash_closes (business_id, date, total_usd, total_ves, exchange_rate, closed_by, cashea_receivable_usd, cashea_receivable_ves)
VALUES (
  '3c000000-0000-0000-0000-000000000003', current_setting('test.today')::date - 1,
  30, 2400, 80, 'a0000000-0000-0000-0000-000000000001', 50, 4000
);

CREATE TEMP TABLE closed_day ON COMMIT DROP AS
SELECT *
FROM public.cash_closes
WHERE business_id = '3c000000-0000-0000-0000-000000000003';

GRANT SELECT ON closed_day TO authenticated;

SELECT set_config('app.suppress_log_entry', 'false', true);

SELECT ok(
  NOT has_function_privilege('anon', 'public.void_cashea_order(uuid,uuid,public.cashea_void_reason,text)', 'EXECUTE'),
  'anon no puede ejecutar void_cashea_order'
);

SET LOCAL ROLE authenticated;

-- ─── Solo el Administrador ──────────────────────────────────────────────────

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT throws_ok(
  $$
    SELECT public.void_cashea_order(
      '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000201',
      'customer_return', 'El cliente devolvió la compra'
    )
  $$,
  'P0001',
  'Solo un administrador puede anular una Orden Cashea',
  'El empleado no anula una Orden Cashea'
);

-- ─── El Administrador anula y queda el rastro ───────────────────────────────

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT public.void_cashea_order(
  '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000201',
  'customer_return', '  El cliente devolvió la compra  '
);

SELECT results_eq(
  $$
    SELECT status, voided_at = now(), voided_by::text, void_reason, void_note
    FROM public.cashea_orders
    WHERE id = '3c000000-0000-0000-0000-000000000201'
  $$,
  $$
    VALUES (
      'voided'::public.cashea_order_status,
      true,
      'a0000000-0000-0000-0000-000000000001'::text,
      'customer_return'::public.cashea_void_reason,
      'El cliente devolvió la compra'::text
    )
  $$,
  'La orden queda Anulada con quién, cuándo, el motivo y la nota'
);

-- ─── Solo desde Pendiente ───────────────────────────────────────────────────

SELECT throws_ok(
  $$
    SELECT public.void_cashea_order(
      '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000201',
      'registration_error', 'Segundo intento'
    )
  $$,
  'P0001',
  'La Orden Cashea ya está anulada',
  'Una orden Anulada no se vuelve a anular'
);

SELECT throws_ok(
  $$
    SELECT public.void_cashea_order(
      '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000202',
      'registration_error', 'No era Cashea'
    )
  $$,
  'P0001',
  'Una Orden Cashea Cobrada no se anula: primero revierte su depósito',
  'Una orden Cobrada no se anula'
);

-- ─── Motivo y nota obligatorios ─────────────────────────────────────────────

SELECT throws_ok(
  $$
    SELECT public.void_cashea_order(
      '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000203',
      null, 'Sin motivo'
    )
  $$,
  'P0001',
  'El motivo de la anulación es requerido',
  'Sin motivo se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.void_cashea_order(
      '3c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000203',
      'registration_error', '   '
    )
  $$,
  'P0001',
  'La nota de la anulación es requerida',
  'Una nota en blanco se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.void_cashea_order(
      '10000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000203',
      'registration_error', 'Negocio equivocado'
    )
  $$,
  'P0001',
  'Orden Cashea inexistente o perteneciente a otro negocio',
  'Una orden de otro negocio se rechaza'
);

SELECT results_eq(
  $$
    SELECT id::text, status
    FROM public.cashea_orders
    WHERE id IN ('3c000000-0000-0000-0000-000000000202', '3c000000-0000-0000-0000-000000000203')
    ORDER BY id
  $$,
  $$
    VALUES
      ('3c000000-0000-0000-0000-000000000202', 'collected'::public.cashea_order_status),
      ('3c000000-0000-0000-0000-000000000203', 'pending'::public.cashea_order_status)
  $$,
  'Los intentos rechazados no cambian las órdenes'
);

-- ─── Ejemplo de REQ-007: «Devolución del cliente» en un día posterior ───────

SELECT results_eq(
  $$
    SELECT total_usd, cashea_receivable_usd, net_usd
    FROM public.get_cash_close_summary('3c000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1)
  $$,
  $$ VALUES (100::numeric, 60::numeric, 40::numeric) $$,
  'El lunes: Total facturado $100, Por cobrar Cashea $60 y Total producido $40'
);

SELECT lives_ok(
  $$
    SELECT public.void_cashea_order(
      '3c000000-0000-0000-0000-000000000002', '3c000000-0000-0000-0000-000000000211',
      'customer_return', 'El cliente devolvió la compra del lunes'
    )
  $$,
  'El Administrador anula la orden del lunes por «Devolución del cliente»'
);

SELECT results_eq(
  $$
    SELECT total_usd, total_returns_usd, cashea_receivable_usd, cashea_voided_return_usd, cashea_voided_return_ves, net_usd
    FROM public.get_cash_close_summary('3c000000-0000-0000-0000-000000000002', current_setting('test.today')::date)
  $$,
  $$ VALUES (200::numeric, 100::numeric, 0::numeric, 60::numeric, 4800::numeric, 160::numeric) $$,
  'El martes: Total facturado $200, Crédito Devolución $100, Cashea anulado por devolución $60 y Total producido $160'
);

SELECT results_eq(
  $$
    SELECT cashea_receivable_usd, net_usd
    FROM public.get_cash_close_summary('3c000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1)
  $$,
  $$ VALUES (60::numeric, 40::numeric) $$,
  'El lunes conserva su Por cobrar Cashea'
);

-- ─── Anulación el mismo día de la venta, con cualquier motivo ───────────────

SELECT public.void_cashea_order(
  '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000221',
  'registration_error', 'No era una Venta Cashea'
);

SELECT public.void_cashea_order(
  '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000222',
  'customer_return', 'El cliente devolvió la compra en el día'
);

SELECT results_eq(
  $$
    SELECT total_usd, cashea_receivable_usd, cashea_voided_return_usd, net_usd
    FROM public.get_cash_close_summary('3c000000-0000-0000-0000-000000000003', current_setting('test.today')::date)
  $$,
  $$ VALUES (90::numeric, 0::numeric, 0::numeric, 90::numeric) $$,
  'Anuladas el mismo día de su venta, las órdenes dejan de contar en el Por cobrar Cashea sin otra línea'
);

-- ─── «Error de registro» en un día posterior, ya cerrado ────────────────────

SELECT public.void_cashea_order(
  '3c000000-0000-0000-0000-000000000003', '3c000000-0000-0000-0000-000000000223',
  'registration_error', 'Se marcó Cashea por error'
);

SELECT results_eq(
  $$
    SELECT today.cashea_voided_return_usd, today.net_usd, yesterday.cashea_receivable_usd, yesterday.net_usd
    FROM public.get_cash_close_summary('3c000000-0000-0000-0000-000000000003', current_setting('test.today')::date) today
    CROSS JOIN public.get_cash_close_summary('3c000000-0000-0000-0000-000000000003', current_setting('test.today')::date - 1) yesterday
  $$,
  $$ VALUES (0::numeric, 90::numeric, 0::numeric, 80::numeric) $$,
  '«Error de registro» no suma nada al día de la anulación y la orden deja de contar en el resumen en vivo del día de la venta'
);

SELECT results_eq(
  $$
    SELECT to_jsonb(c)
    FROM public.cash_closes c
    WHERE business_id = '3c000000-0000-0000-0000-000000000003'
  $$,
  $$ SELECT to_jsonb(c) FROM closed_day c $$,
  'Anular una orden de un día cerrado no cambia su cierre guardado'
);

SELECT * FROM finish();
ROLLBACK;
