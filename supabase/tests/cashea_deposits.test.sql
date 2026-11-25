BEGIN;

SELECT plan(27);

SELECT set_config('test.today', ((now() AT TIME ZONE 'America/Caracas')::date)::text, true);
SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.businesses (id, name, slug)
VALUES
  ('3d000000-0000-0000-0000-000000000001', 'Prueba depósito Cashea', 'prueba-deposito-cashea'),
  ('3d000000-0000-0000-0000-000000000002', 'Prueba depósito Cashea, otro negocio', 'prueba-deposito-cashea-otro');

INSERT INTO public.user_business_access (user_id, business_id)
VALUES ('a0000000-0000-0000-0000-000000000002', '3d000000-0000-0000-0000-000000000001');

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES ('3d000000-0000-0000-0000-000000000011', '3d000000-0000-0000-0000-000000000001', 'DEP-01', 'Producto para depósito Cashea', 50, 185.60, true);

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES
  ('3d000000-0000-0000-0000-000000000101', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1),
  ('3d000000-0000-0000-0000-000000000102', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date),
  ('3d000000-0000-0000-0000-000000000103', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date),
  ('3d000000-0000-0000-0000-000000000104', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date),
  ('3d000000-0000-0000-0000-000000000105', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date),
  ('3d000000-0000-0000-0000-000000000111', '3d000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date);

INSERT INTO public.transactions (business_id, sale_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date)
VALUES (
  '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000102',
  '3d000000-0000-0000-0000-000000000011', 1, 185.60, 7424, 40,
  'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date
);

INSERT INTO public.cashea_deposits (id, business_id, deposit_date, received_ves, expected_net_usd, created_by)
VALUES (
  '3d000000-0000-0000-0000-000000000401', '3d000000-0000-0000-0000-000000000001',
  current_setting('test.today')::date - 1, 1500, 35.20, 'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO public.cashea_deposits (id, business_id, deposit_date, received_ves, expected_net_usd, created_by)
VALUES (
  '3d000000-0000-0000-0000-000000000402', '3d000000-0000-0000-0000-000000000002',
  current_setting('test.today')::date - 1, 900, 20, 'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
)
VALUES
  (
    '3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000101',
    current_setting('test.today')::date - 1, 40, 'DEP-200', 'F-401',
    200, 100, 100, 4, 4, 88.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3d000000-0000-0000-0000-000000000302', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000102',
    current_setting('test.today')::date, 40, 'DEP-185', 'F-402',
    185.60, 92.80, 92.80, 4, 4, 81.67, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3d000000-0000-0000-0000-000000000305', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000105',
    current_setting('test.today')::date, 40, 'DEP-NEGATIVE', 'F-405',
    100, 99, 1, 4, 4, -3.04, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3d000000-0000-0000-0000-000000000311', '3d000000-0000-0000-0000-000000000002', '3d000000-0000-0000-0000-000000000111',
    current_setting('test.today')::date, 40, 'DEP-OTHER', 'F-411',
    50, 20, 30, 4, 4, 26.80, 'a0000000-0000-0000-0000-000000000001'
  );

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, deposit_id, collected_at, voided_at, voided_by, void_reason, void_note, created_by
)
VALUES
  (
    '3d000000-0000-0000-0000-000000000303', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000103',
    current_setting('test.today')::date, 40, 'DEP-VOIDED', 'F-403',
    50, 20, 30, 4, 4, 26.80,
    'voided', null, null, now(), 'a0000000-0000-0000-0000-000000000001', 'registration_error', 'No era Cashea',
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3d000000-0000-0000-0000-000000000304', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000104',
    current_setting('test.today')::date, 40, 'DEP-COLLECTED', 'F-404',
    80, 40, 40, 4, 4, 35.20,
    'collected', '3d000000-0000-0000-0000-000000000401', now(), null, null, null, null,
    'a0000000-0000-0000-0000-000000000002'
  );

SELECT set_config('app.suppress_log_entry', 'false', true);

SELECT ok(
  NOT has_function_privilege('anon', 'public.register_cashea_deposit(uuid,uuid[],numeric,date,numeric,text)', 'EXECUTE'),
  'anon no puede ejecutar register_cashea_deposit'
);

SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001', ARRAY['3d000000-0000-0000-0000-000000000301']::uuid[],
      3500, current_setting('test.today')::date, null, null
    )
  $$,
  'P0001',
  'Solo un administrador puede registrar un Depósito Cashea',
  'El empleado no registra un Depósito Cashea'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

CREATE TEMP TABLE summary_before ON COMMIT DROP AS
SELECT * FROM public.get_cash_close_summary('3d000000-0000-0000-0000-000000000001', current_setting('test.today')::date);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001', ARRAY[]::uuid[],
      3500, current_setting('test.today')::date, null, null
    )
  $$,
  'P0001',
  'Selecciona al menos una Orden Cashea',
  'Una lista vacía se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001',
      ARRAY['3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000301']::uuid[],
      3500, current_setting('test.today')::date, null, null
    )
  $$,
  'P0001',
  'Una Orden Cashea está repetida en el depósito',
  'Una orden repetida se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001',
      ARRAY['3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000303']::uuid[],
      3500, current_setting('test.today')::date, null, null
    )
  $$,
  'P0001',
  'Una de las Órdenes Cashea está anulada',
  'Una orden Anulada hace fallar el depósito'
);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001',
      ARRAY['3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000304']::uuid[],
      3500, current_setting('test.today')::date, null, null
    )
  $$,
  'P0001',
  'Una de las Órdenes Cashea ya está cobrada',
  'Una orden ya Cobrada hace fallar el depósito'
);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001',
      ARRAY['3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000311']::uuid[],
      3500, current_setting('test.today')::date, null, null
    )
  $$,
  'P0001',
  'Orden Cashea inexistente o perteneciente a otro negocio',
  'Una orden de otro negocio hace fallar el depósito'
);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001', ARRAY['3d000000-0000-0000-0000-000000000301']::uuid[],
      3500, current_setting('test.today')::date + 1, null, null
    )
  $$,
  'P0001',
  'La fecha del depósito no puede ser futura',
  'Una fecha futura se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001', ARRAY['3d000000-0000-0000-0000-000000000301']::uuid[],
      0, current_setting('test.today')::date, null, null
    )
  $$,
  'P0001',
  'Los bolívares recibidos deben ser mayores a cero',
  'Cero bolívares se rechaza'
);

SELECT results_eq(
  $$
    SELECT
      (SELECT count(*) FROM public.cashea_deposits WHERE business_id = '3d000000-0000-0000-0000-000000000001'),
      (
        SELECT count(*)
        FROM public.cashea_orders
        WHERE id IN ('3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000302')
          AND status = 'pending'
      )
  $$,
  $$ VALUES (1::bigint, 2::bigint) $$,
  'Los intentos rechazados no crean depósitos ni cambian órdenes'
);

SELECT set_config(
  'test.deposit_id',
  public.register_cashea_deposit(
    '3d000000-0000-0000-0000-000000000001',
    ARRAY['3d000000-0000-0000-0000-000000000302', '3d000000-0000-0000-0000-000000000301']::uuid[],
    6500, current_setting('test.today')::date, 38.50, '  REF-0001  '
  )::text,
  true
);

SELECT results_eq(
  $$
    SELECT deposit_date, received_ves, applied_rate, expected_net_usd, implied_rate, difference_usd, reference, created_by::text
    FROM public.cashea_deposits
    WHERE id = current_setting('test.deposit_id')::uuid
  $$,
  $$
    VALUES (
      current_setting('test.today')::date, 6500::numeric, 38.50::numeric, 169.67::numeric, 38.3097::numeric, 0.84::numeric,
      'REF-0001'::text, 'a0000000-0000-0000-0000-000000000001'::text
    )
  $$,
  'El depósito guarda el Neto esperado total, la Tasa implícita y la diferencia'
);

SELECT results_eq(
  $$
    SELECT id::text, status, deposit_id = current_setting('test.deposit_id')::uuid, collected_at = now()
    FROM public.cashea_orders
    WHERE id IN ('3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000302')
    ORDER BY id
  $$,
  $$
    VALUES
      ('3d000000-0000-0000-0000-000000000301', 'collected'::public.cashea_order_status, true, true),
      ('3d000000-0000-0000-0000-000000000302', 'collected'::public.cashea_order_status, true, true)
  $$,
  'Las órdenes quedan Cobradas con el depósito'
);

SELECT results_eq(
  $$
    SELECT to_jsonb(s)
    FROM public.get_cash_close_summary('3d000000-0000-0000-0000-000000000001', current_setting('test.today')::date) s
  $$,
  $$ SELECT to_jsonb(s) FROM summary_before s $$,
  'Cobrar no cambia los importes del cierre del día'
);

SELECT set_config(
  'test.negative_deposit_id',
  public.register_cashea_deposit(
    '3d000000-0000-0000-0000-000000000001', ARRAY['3d000000-0000-0000-0000-000000000305']::uuid[],
    40, current_setting('test.today')::date, null, null
  )::text,
  true
);

SELECT results_eq(
  $$
    SELECT expected_net_usd, implied_rate, difference_usd
    FROM public.cashea_deposits
    WHERE id = current_setting('test.negative_deposit_id')::uuid
  $$,
  $$ VALUES (-3.04::numeric, null::numeric, null::numeric) $$,
  'Con Neto esperado ≤ 0 el depósito se registra sin Tasa implícita'
);

SELECT ok(
  NOT has_function_privilege('anon', 'private.register_cashea_deposit(uuid,uuid[],numeric,date,numeric,text)', 'EXECUTE'),
  'anon no puede ejecutar private.register_cashea_deposit'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.revert_cashea_deposit(uuid,uuid,text)', 'EXECUTE'),
  'anon no puede ejecutar revert_cashea_deposit'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT throws_ok(
  $$
    SELECT public.revert_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001', current_setting('test.deposit_id')::uuid, 'Monto equivocado'
    )
  $$,
  'P0001',
  'Solo un administrador puede revertir un Depósito Cashea',
  'El empleado no revierte un Depósito Cashea'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT throws_ok(
  $$
    SELECT public.revert_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001', current_setting('test.deposit_id')::uuid, '   '
    )
  $$,
  'P0001',
  'La nota de la reversión es requerida',
  'La reversión exige nota'
);

SELECT throws_ok(
  $$
    SELECT public.revert_cashea_deposit(
      '3d000000-0000-0000-0000-000000000002', current_setting('test.deposit_id')::uuid, 'Negocio equivocado'
    )
  $$,
  'P0001',
  'Depósito Cashea inexistente o perteneciente a otro negocio',
  'Un depósito de otro negocio se rechaza'
);

SELECT public.revert_cashea_deposit(
  '3d000000-0000-0000-0000-000000000001', current_setting('test.deposit_id')::uuid, '  Monto equivocado  '
);

SELECT results_eq(
  $$
    SELECT id::text, status, deposit_id, collected_at
    FROM public.cashea_orders
    WHERE id IN ('3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000302')
    ORDER BY id
  $$,
  $$
    VALUES
      ('3d000000-0000-0000-0000-000000000301', 'pending'::public.cashea_order_status, null::uuid, null::timestamptz),
      ('3d000000-0000-0000-0000-000000000302', 'pending'::public.cashea_order_status, null::uuid, null::timestamptz)
  $$,
  'Revertir devuelve las órdenes a Pendiente'
);

SELECT results_eq(
  $$
    SELECT received_ves, expected_net_usd, reverted_at = now(), reverted_by::text, revert_note
    FROM public.cashea_deposits
    WHERE id = current_setting('test.deposit_id')::uuid
  $$,
  $$ VALUES (6500::numeric, 169.67::numeric, true, 'a0000000-0000-0000-0000-000000000001'::text, 'Monto equivocado'::text) $$,
  'El depósito queda revertido con la nota, sin borrarse'
);

SELECT throws_ok(
  $$
    SELECT public.revert_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001', current_setting('test.deposit_id')::uuid, 'Otra vez'
    )
  $$,
  'P0001',
  'El Depósito Cashea ya está revertido',
  'Un depósito revertido no se revierte de nuevo'
);

SELECT lives_ok(
  $$
    SELECT public.register_cashea_deposit(
      '3d000000-0000-0000-0000-000000000001',
      ARRAY['3d000000-0000-0000-0000-000000000301', '3d000000-0000-0000-0000-000000000302']::uuid[],
      6600, current_setting('test.today')::date, null, 'REF-0002'
    )
  $$,
  'Las órdenes de un depósito revertido se pueden volver a cobrar'
);

SELECT public.revert_cashea_deposit(
  '3d000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.cashea_deposits WHERE reference = 'REF-0002'),
  'Se registró dos veces'
);

SELECT results_eq(
  $$
    SELECT to_jsonb(s)
    FROM public.get_cash_close_summary('3d000000-0000-0000-0000-000000000001', current_setting('test.today')::date) s
  $$,
  $$ SELECT to_jsonb(s) FROM summary_before s $$,
  'Revertir no cambia los importes del cierre del día'
);

SELECT ok(
  NOT has_function_privilege('anon', 'private.revert_cashea_deposit(uuid,uuid,text)', 'EXECUTE'),
  'anon no puede ejecutar private.revert_cashea_deposit'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT ok(
  (SELECT count(*) FROM public.cashea_deposits WHERE business_id = '3d000000-0000-0000-0000-000000000001') > 0,
  'El empleado ve los Depósitos Cashea de su negocio'
);

SELECT is(
  (SELECT count(*)::integer FROM public.cashea_deposits WHERE business_id = '3d000000-0000-0000-0000-000000000002'),
  0,
  'El empleado no ve los Depósitos Cashea de otro negocio'
);

SELECT * FROM finish();
ROLLBACK;
