BEGIN;

SELECT plan(16);

SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.businesses (id, name, slug)
VALUES
  ('3e000000-0000-0000-0000-000000000001', 'Prueba comisiones Cashea', 'prueba-comisiones-cashea'),
  ('3e000000-0000-0000-0000-000000000002', 'Otro negocio comisiones Cashea', 'otro-negocio-comisiones-cashea');

INSERT INTO public.user_business_access (user_id, business_id)
VALUES ('a0000000-0000-0000-0000-000000000002', '3e000000-0000-0000-0000-000000000001');

INSERT INTO public.app_settings (business_id, cashea_service_fee_pct, cashea_advance_fee_pct)
VALUES ('3e000000-0000-0000-0000-000000000001', 10, 10)
ON CONFLICT (business_id) DO UPDATE
SET cashea_service_fee_pct = excluded.cashea_service_fee_pct,
    cashea_advance_fee_pct = excluded.cashea_advance_fee_pct;

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES
  ('3e000000-0000-0000-0000-000000000101', '3e000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_date - 3),
  ('3e000000-0000-0000-0000-000000000102', '3e000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_date - 3),
  ('3e000000-0000-0000-0000-000000000103', '3e000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_date - 3),
  ('3e000000-0000-0000-0000-000000000104', '3e000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_date - 3),
  ('3e000000-0000-0000-0000-000000000105', '3e000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', current_date - 3);

INSERT INTO public.cashea_deposits (id, business_id, deposit_date, received_ves, expected_net_usd, created_by)
VALUES (
  '3e000000-0000-0000-0000-000000000401', '3e000000-0000-0000-0000-000000000001',
  current_date - 1, 1000, 14.00, 'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, deposit_id, collected_at, voided_at, voided_by, void_reason, void_note, created_by
)
VALUES
  (
    '3e000000-0000-0000-0000-000000000201', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000101',
    current_date - 3, 80, 'COM-PEND-1', 'F-501', 200, 100, 100, 10, 10, 70.00,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3e000000-0000-0000-0000-000000000202', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000102',
    current_date - 3, 80, 'COM-PEND-2', 'F-502', 185.60, 92.80, 92.80, 10, 10, 64.96,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3e000000-0000-0000-0000-000000000203', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000103',
    current_date - 3, 80, 'COM-COLLECTED', 'F-503', 40, 20, 20, 10, 10, 14.00,
    'collected', '3e000000-0000-0000-0000-000000000401', now(), null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3e000000-0000-0000-0000-000000000204', '3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000104',
    current_date - 3, 80, 'COM-VOIDED', 'F-504', 100, 40, 60, 10, 10, 44.00,
    'voided', null, null, now(), 'a0000000-0000-0000-0000-000000000001', 'registration_error', 'Se registró dos veces',
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3e000000-0000-0000-0000-000000000205', '3e000000-0000-0000-0000-000000000002', '3e000000-0000-0000-0000-000000000105',
    current_date - 3, 80, 'COM-OTHER', 'F-505', 100, 40, 60, 10, 10, 44.00,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000001'
  );

SELECT ok(
  NOT has_function_privilege('anon', 'public.update_cashea_settings(uuid,numeric,numeric,boolean)', 'EXECUTE'),
  'anon no puede ejecutar update_cashea_settings'
);

SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT results_eq(
  $$
    SELECT cashea_service_fee_pct, cashea_advance_fee_pct
    FROM public.app_settings
    WHERE business_id = '3e000000-0000-0000-0000-000000000001'
  $$,
  $$ VALUES (10::numeric(5,2), 10::numeric(5,2)) $$,
  'El empleado lee los porcentajes de la Comisión Cashea'
);

SELECT throws_ok(
  $$ SELECT public.update_cashea_settings('3e000000-0000-0000-0000-000000000001', 5, 3) $$,
  'P0001',
  'Solo un administrador puede cambiar la Comisión Cashea',
  'El empleado no cambia la Comisión Cashea por RPC'
);

SELECT throws_ok(
  $$
    UPDATE public.app_settings
    SET cashea_service_fee_pct = 1,
        updated_by = 'a0000000-0000-0000-0000-000000000002'
    WHERE business_id = '3e000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  NULL,
  'El empleado no cambia la Comisión Cashea con update directo'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT is(
  public.update_cashea_settings('3e000000-0000-0000-0000-000000000001', 5, 3),
  0,
  'Sin aplicar a Pendientes no recalcula ninguna orden'
);

SELECT results_eq(
  $$
    SELECT cashea_service_fee_pct, cashea_advance_fee_pct, updated_by::text, updated_at = now()
    FROM public.app_settings
    WHERE business_id = '3e000000-0000-0000-0000-000000000001'
  $$,
  $$ VALUES (5::numeric(5,2), 3::numeric(5,2), 'a0000000-0000-0000-0000-000000000001'::text, true) $$,
  'El Administrador guarda los porcentajes nuevos con su usuario y fecha'
);

SELECT results_eq(
  $$
    SELECT service_fee_pct, advance_fee_pct, expected_net_usd
    FROM public.cashea_orders
    WHERE business_id = '3e000000-0000-0000-0000-000000000001'
    ORDER BY order_number
  $$,
  $$
    VALUES
      (10::numeric(5,2), 10::numeric(5,2), 14.00::numeric(12,2)),
      (10::numeric(5,2), 10::numeric(5,2), 70.00::numeric(12,2)),
      (10::numeric(5,2), 10::numeric(5,2), 64.96::numeric(12,2)),
      (10::numeric(5,2), 10::numeric(5,2), 44.00::numeric(12,2))
  $$,
  'Sin aplicar a Pendientes las órdenes conservan sus porcentajes copiados'
);

SELECT is(
  public.update_cashea_settings('3e000000-0000-0000-0000-000000000001', 4, 4, true),
  2,
  'Aplicar a Pendientes devuelve cuántas órdenes recalculó'
);

SELECT results_eq(
  $$
    SELECT order_number, service_fee_pct, advance_fee_pct, expected_net_usd
    FROM public.cashea_orders
    WHERE business_id = '3e000000-0000-0000-0000-000000000001'
      AND status = 'pending'
    ORDER BY order_number
  $$,
  $$
    VALUES
      ('COM-PEND-1'::text, 4::numeric(5,2), 4::numeric(5,2), 88.00::numeric(12,2)),
      ('COM-PEND-2'::text, 4::numeric(5,2), 4::numeric(5,2), 81.67::numeric(12,2))
  $$,
  'Las Pendientes toman los porcentajes nuevos y recalculan el Neto esperado'
);

SELECT results_eq(
  $$
    SELECT order_number, service_fee_pct, advance_fee_pct, expected_net_usd
    FROM public.cashea_orders
    WHERE id IN (
      '3e000000-0000-0000-0000-000000000203',
      '3e000000-0000-0000-0000-000000000204',
      '3e000000-0000-0000-0000-000000000205'
    )
    ORDER BY order_number
  $$,
  $$
    VALUES
      ('COM-COLLECTED'::text, 10::numeric(5,2), 10::numeric(5,2), 14.00::numeric(12,2)),
      ('COM-OTHER'::text, 10::numeric(5,2), 10::numeric(5,2), 44.00::numeric(12,2)),
      ('COM-VOIDED'::text, 10::numeric(5,2), 10::numeric(5,2), 44.00::numeric(12,2))
  $$,
  'Las Cobradas, las Anuladas y las Pendientes de otro negocio no cambian'
);

SELECT throws_ok(
  $$ SELECT public.update_cashea_settings('3e000000-0000-0000-0000-000000000001', 100.01, 4) $$,
  'P0001',
  'Los porcentajes de la Comisión Cashea deben estar entre 0 y 100',
  'Un porcentaje mayor que 100 se rechaza'
);

SELECT throws_ok(
  $$ SELECT public.update_cashea_settings('3e000000-0000-0000-0000-000000000001', 4, -1) $$,
  'P0001',
  'Los porcentajes de la Comisión Cashea deben estar entre 0 y 100',
  'Un porcentaje negativo se rechaza'
);

SELECT throws_ok(
  $$ SELECT public.update_cashea_settings('3e000000-0000-0000-0000-000000000001', null, 4) $$,
  'P0001',
  'Los porcentajes de la Comisión Cashea deben estar entre 0 y 100',
  'Un porcentaje vacío se rechaza'
);

SELECT throws_ok(
  $$ SELECT public.update_cashea_settings('3e000000-0000-0000-0000-000000000001', 4.125, 4) $$,
  'P0001',
  'Los porcentajes de la Comisión Cashea admiten como máximo dos decimales',
  'Un porcentaje con tres decimales se rechaza'
);

SELECT is(
  public.update_cashea_settings('3e000000-0000-0000-0000-000000000002', 6, 2),
  0,
  'Un negocio sin ajustes guardados recibe sus porcentajes'
);

SELECT results_eq(
  $$
    SELECT cashea_service_fee_pct, cashea_advance_fee_pct
    FROM public.app_settings
    WHERE business_id = '3e000000-0000-0000-0000-000000000002'
  $$,
  $$ VALUES (6::numeric(5,2), 2::numeric(5,2)) $$,
  'Los porcentajes quedan guardados en el negocio que no tenía ajustes'
);

SELECT * FROM finish();
ROLLBACK;
