BEGIN;

SELECT plan(7);

SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.businesses (id, name, slug)
VALUES
  ('3e000000-0000-0000-0000-000000000001', 'Prueba saldo Cashea', 'prueba-saldo-cashea'),
  ('3e000000-0000-0000-0000-000000000002', 'Otro negocio saldo Cashea', 'otro-negocio-saldo-cashea');

INSERT INTO public.user_business_access (user_id, business_id)
VALUES ('a0000000-0000-0000-0000-000000000002', '3e000000-0000-0000-0000-000000000001');

INSERT INTO public.sales (id, business_id, user_id, date)
SELECT
  ('3e000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid,
  CASE WHEN n = 9 THEN '3e000000-0000-0000-0000-000000000002' ELSE '3e000000-0000-0000-0000-000000000001' END::uuid,
  'a0000000-0000-0000-0000-000000000002',
  '2026-03-01'::date
FROM generate_series(1, 9) n;

INSERT INTO public.cashea_deposits (id, business_id, deposit_date, received_ves, expected_net_usd, created_by)
VALUES (
  '3e000000-0000-0000-0000-000000000401', '3e000000-0000-0000-0000-000000000001',
  '2026-03-10', 1000, 14.00, 'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, deposit_id, collected_at, voided_at, voided_by, void_reason, void_note, created_by
)
VALUES
  (
    '3e000000-0000-0000-0000-000000000201', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000101',
    '2026-03-01', 80, 'SAL-COL', 'F-701', 40, 20, 20, 10, 10, 14.00,
    'collected', '3e000000-0000-0000-0000-000000000401', now(), null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3e000000-0000-0000-0000-000000000202', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000102',
    '2026-02-20', 80, 'SAL-VOID', 'F-702', 40, 20, 20, 10, 10, 14.00,
    'voided', null, null, now(), 'a0000000-0000-0000-0000-000000000001', 'registration_error', 'Se registró dos veces',
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3e000000-0000-0000-0000-000000000209', '3e000000-0000-0000-0000-000000000002', '3e000000-0000-0000-0000-000000000109',
    '2026-01-15', 80, 'SAL-OTHER', 'F-709', 100, 0, 100, 10, 10, 81.00,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000001'
  );

SELECT set_config('app.suppress_log_entry', 'false', true);

SELECT ok(
  NOT has_function_privilege('anon', 'public.get_cashea_receivable_summary(uuid)', 'EXECUTE'),
  'anon no puede ejecutar get_cashea_receivable_summary'
);

SELECT ok(
  NOT has_function_privilege('anon', 'private.get_cashea_receivable_summary(uuid)', 'EXECUTE'),
  'anon no puede ejecutar private.get_cashea_receivable_summary'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_receivable_summary('3e000000-0000-0000-0000-000000000001') $$,
  $$ VALUES (0::numeric, 0::numeric, 0, null::date) $$,
  'Sin Pendientes devuelve ceros y fecha null, sin contar cobradas, anuladas ni el otro negocio'
);

RESET ROLE;

SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, created_by
)
VALUES
  (
    '3e000000-0000-0000-0000-000000000203', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000103',
    '2026-03-05', 80, 'SAL-PEND-1', 'F-703', 50.50, 25, 25.50, 10, 10, 18.36,
    'pending', 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3e000000-0000-0000-0000-000000000204', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000104',
    '2026-02-27', 80, 'SAL-PEND-2', 'F-704', 40.25, 20, 20.25, 10, 10, 14.58,
    'pending', 'a0000000-0000-0000-0000-000000000002'
  );

SELECT set_config('app.suppress_log_entry', 'false', true);

SET LOCAL ROLE authenticated;

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_receivable_summary('3e000000-0000-0000-0000-000000000001') $$,
  $$ VALUES (45.75::numeric, 32.94::numeric, 2, '2026-02-27'::date) $$,
  'El empleado lee el saldo, el neto esperado, la cantidad y la venta Pendiente más antigua de su negocio'
);

SELECT throws_ok(
  $$ SELECT * FROM public.get_cashea_receivable_summary('3e000000-0000-0000-0000-000000000002') $$,
  'P0001',
  'Negocio inexistente, inactivo o no autorizado',
  'El empleado no consulta un negocio sin acceso'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_receivable_summary('3e000000-0000-0000-0000-000000000002') $$,
  $$ VALUES (100::numeric, 81::numeric, 1, '2026-01-15'::date) $$,
  'El otro negocio solo suma su propia orden'
);

RESET ROLE;

UPDATE public.cashea_orders
SET status = 'collected', deposit_id = '3e000000-0000-0000-0000-000000000401', collected_at = now()
WHERE id = '3e000000-0000-0000-0000-000000000204';

SET LOCAL ROLE authenticated;

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_receivable_summary('3e000000-0000-0000-0000-000000000001') $$,
  $$ VALUES (25.50::numeric, 18.36::numeric, 1, '2026-03-05'::date) $$,
  'Cobrar la Pendiente más antigua la saca del saldo y mueve la antigüedad'
);

SELECT * FROM finish();
ROLLBACK;
