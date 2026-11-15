BEGIN;

SELECT plan(11);

SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.businesses (id, name, slug)
VALUES
  ('3f000000-0000-0000-0000-000000000001', 'Prueba indicador Cashea', 'prueba-indicador-cashea'),
  ('3f000000-0000-0000-0000-000000000002', 'Otro negocio indicador Cashea', 'otro-negocio-indicador-cashea');

INSERT INTO public.user_business_access (user_id, business_id)
VALUES ('a0000000-0000-0000-0000-000000000002', '3f000000-0000-0000-0000-000000000001');

INSERT INTO public.sales (id, business_id, user_id, date)
SELECT
  ('3f000000-0000-0000-0000-0000000001' || lpad(n::text, 2, '0'))::uuid,
  CASE WHEN n = 9 THEN '3f000000-0000-0000-0000-000000000002' ELSE '3f000000-0000-0000-0000-000000000001' END::uuid,
  'a0000000-0000-0000-0000-000000000002',
  '2026-03-02'::date
FROM generate_series(1, 9) n;

INSERT INTO public.cashea_deposits (id, business_id, deposit_date, received_ves, expected_net_usd, created_by)
VALUES (
  '3f000000-0000-0000-0000-000000000401', '3f000000-0000-0000-0000-000000000001',
  '2026-03-10', 1000, 14.00, 'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, deposit_id, collected_at, voided_at, voided_by, void_reason, void_note, created_by
)
VALUES
  (
    '3f000000-0000-0000-0000-000000000201', '3f000000-0000-0000-0000-000000000001', '3f000000-0000-0000-0000-000000000101',
    '2026-03-02', 80, 'IND-MON-COL', 'F-601', 40, 20, 20, 10, 10, 14.00,
    'collected', '3f000000-0000-0000-0000-000000000401', now(), null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3f000000-0000-0000-0000-000000000202', '3f000000-0000-0000-0000-000000000001', '3f000000-0000-0000-0000-000000000102',
    '2026-03-02', 80, 'IND-MON-PEND', 'F-602', 40, 20, 20, 10, 10, 14.00,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3f000000-0000-0000-0000-000000000203', '3f000000-0000-0000-0000-000000000001', '3f000000-0000-0000-0000-000000000103',
    '2026-03-02', 80, 'IND-MON-VOID', 'F-603', 40, 20, 20, 10, 10, 14.00,
    'voided', null, null, now(), 'a0000000-0000-0000-0000-000000000001', 'registration_error', 'Se registró dos veces',
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3f000000-0000-0000-0000-000000000204', '3f000000-0000-0000-0000-000000000001', '3f000000-0000-0000-0000-000000000104',
    '2026-03-03', 80, 'IND-TUE-VOID', 'F-604', 40, 20, 20, 10, 10, 14.00,
    'voided', null, null, now(), 'a0000000-0000-0000-0000-000000000001', 'registration_error', 'Se registró dos veces',
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3f000000-0000-0000-0000-000000000205', '3f000000-0000-0000-0000-000000000001', '3f000000-0000-0000-0000-000000000105',
    '2026-03-04', 80, 'IND-WED-COL', 'F-605', 40, 20, 20, 10, 10, 14.00,
    'collected', '3f000000-0000-0000-0000-000000000401', now(), null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3f000000-0000-0000-0000-000000000206', '3f000000-0000-0000-0000-000000000001', '3f000000-0000-0000-0000-000000000106',
    '2026-03-04', 80, 'IND-WED-PEND', 'F-606', 40, 20, 20, 10, 10, 14.00,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3f000000-0000-0000-0000-000000000209', '3f000000-0000-0000-0000-000000000002', '3f000000-0000-0000-0000-000000000109',
    '2026-03-02', 80, 'IND-OTHER', 'F-609', 40, 20, 20, 10, 10, 14.00,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000001'
  );

SELECT set_config('app.suppress_log_entry', 'false', true);

SELECT ok(
  NOT has_function_privilege('anon', 'public.get_cashea_collection_status(uuid,date,date)', 'EXECUTE'),
  'anon no puede ejecutar get_cashea_collection_status'
);

SELECT ok(
  NOT has_function_privilege('anon', 'private.get_cashea_collection_status(uuid,date,date)', 'EXECUTE'),
  'anon no puede ejecutar private.get_cashea_collection_status'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000001') $$,
  $$
    VALUES
      ('2026-03-02'::date, 2, 1),
      ('2026-03-04'::date, 2, 1)
  $$,
  'El empleado ve por fecha de venta solo las no anuladas, sin el día que solo tiene anuladas ni el otro negocio'
);

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000001', '2026-03-02', '2026-03-02') $$,
  $$ VALUES ('2026-03-02'::date, 2, 1) $$,
  'Con p_from = p_to devuelve solo esa fecha'
);

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000001', '2026-03-03') $$,
  $$ VALUES ('2026-03-04'::date, 2, 1) $$,
  'Con solo p_from devuelve las fechas desde ese día'
);

SELECT is_empty(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000001', '2026-03-03', '2026-03-03') $$,
  'Un día solo con órdenes anuladas no aparece'
);

SELECT throws_ok(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000002') $$,
  'P0001',
  'Negocio inexistente, inactivo o no autorizado',
  'El empleado no consulta un negocio sin acceso'
);

RESET ROLE;

UPDATE public.cashea_orders
SET status = 'collected', deposit_id = '3f000000-0000-0000-0000-000000000401', collected_at = now()
WHERE id = '3f000000-0000-0000-0000-000000000202';

UPDATE public.cashea_orders
SET status = 'voided', voided_at = now(), voided_by = 'a0000000-0000-0000-0000-000000000001',
    void_reason = 'registration_error', void_note = 'Se registró dos veces'
WHERE id = '3f000000-0000-0000-0000-000000000206';

SET LOCAL ROLE authenticated;

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000001', '2026-03-02', '2026-03-02') $$,
  $$ VALUES ('2026-03-02'::date, 2, 2) $$,
  'Cobrar la última Pendiente deja el día completo'
);

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000001', '2026-03-04', '2026-03-04') $$,
  $$ VALUES ('2026-03-04'::date, 1, 1) $$,
  'Anular la última Pendiente también deja el día completo'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT results_eq(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000002') $$,
  $$ VALUES ('2026-03-02'::date, 1, 0) $$,
  'El otro negocio solo ve su propia orden'
);

SELECT is_empty(
  $$ SELECT * FROM public.get_cashea_collection_status('3f000000-0000-0000-0000-000000000001', '2026-03-05') $$,
  'Las fechas sin órdenes Cashea no aparecen'
);

SELECT * FROM finish();
ROLLBACK;
