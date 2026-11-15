BEGIN;

SELECT plan(15);

SELECT set_config('test.today', ((now() AT TIME ZONE 'America/Caracas')::date)::text, true);
SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.businesses (id, name, slug)
VALUES ('3d000000-0000-0000-0000-000000000001', 'Prueba ajuste Cashea', 'prueba-ajuste-cashea');

INSERT INTO public.user_business_access (user_id, business_id)
VALUES ('a0000000-0000-0000-0000-000000000002', '3d000000-0000-0000-0000-000000000001');

INSERT INTO public.app_settings (business_id, cashea_service_fee_pct, cashea_advance_fee_pct)
VALUES ('3d000000-0000-0000-0000-000000000001', 10, 10)
ON CONFLICT (business_id) DO UPDATE
SET cashea_service_fee_pct = excluded.cashea_service_fee_pct,
    cashea_advance_fee_pct = excluded.cashea_advance_fee_pct;

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES ('3d000000-0000-0000-0000-000000000011', '3d000000-0000-0000-0000-000000000001', 'ADJ-01', 'Producto para ajustar Cashea', 50, 100, true);

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES ('3d000000-0000-0000-0000-000000000101', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1);

INSERT INTO public.transactions (business_id, sale_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date)
VALUES (
  '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000101',
  '3d000000-0000-0000-0000-000000000011', 1, 100, 8000, 80,
  'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
)
VALUES (
  '3d000000-0000-0000-0000-000000000201', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000101',
  current_setting('test.today')::date - 1, 80, 'ADJ-TYPO', 'F-40I',
  100, 40, 60, 4, 4, 53.60, 'a0000000-0000-0000-0000-000000000002'
);

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES
  ('3d000000-0000-0000-0000-000000000102', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1),
  ('3d000000-0000-0000-0000-000000000103', '3d000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 1);

INSERT INTO public.cashea_deposits (id, business_id, deposit_date, received_ves, expected_net_usd, created_by)
VALUES (
  '3d000000-0000-0000-0000-000000000401', '3d000000-0000-0000-0000-000000000001',
  current_setting('test.today')::date, 1500, 17.60, 'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO public.cashea_orders (
  id, business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, deposit_id, collected_at, voided_at, voided_by, void_reason, void_note, created_by
)
VALUES
  (
    '3d000000-0000-0000-0000-000000000202', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000102',
    current_setting('test.today')::date - 1, 80, 'ADJ-COLLECTED', 'F-402',
    40, 20, 20, 4, 4, 17.60,
    'collected', '3d000000-0000-0000-0000-000000000401', now(), null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3d000000-0000-0000-0000-000000000203', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000103',
    current_setting('test.today')::date - 1, 80, 'ADJ-TAKEN', 'F-403',
    50, 20, 30, 4, 4, 26.80,
    'pending', null, null, null, null, null, null, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '3d000000-0000-0000-0000-000000000204', '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000101',
    current_setting('test.today')::date - 1, 80, 'ADJ-VOIDED', 'F-404',
    100, 40, 60, 4, 4, 53.60,
    'voided', null, null, now(), 'a0000000-0000-0000-0000-000000000001', 'registration_error', 'Se registró dos veces',
    'a0000000-0000-0000-0000-000000000002'
  );

INSERT INTO public.cash_closes (business_id, date, total_usd, total_ves, exchange_rate, closed_by, cashea_receivable_usd, cashea_receivable_ves)
VALUES (
  '3d000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 1,
  100, 8000, 80, 'a0000000-0000-0000-0000-000000000001', 110, 8800
);

CREATE TEMP TABLE closed_day ON COMMIT DROP AS
SELECT *
FROM public.cash_closes
WHERE business_id = '3d000000-0000-0000-0000-000000000001';

GRANT SELECT ON closed_day TO authenticated;

SELECT set_config('app.suppress_log_entry', 'false', true);

SELECT ok(
  NOT has_function_privilege('anon', 'public.adjust_cashea_order(uuid,uuid,text,text,numeric,numeric,numeric,text)', 'EXECUTE'),
  'anon no puede ejecutar adjust_cashea_order'
);

SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      'ADJ-401', 'F-401', 100, 30, 70, 'Se tecleó mal el cobrado hoy'
    )
  $$,
  'P0001',
  'Solo un administrador puede ajustar una Orden Cashea',
  'El empleado no ajusta una Orden Cashea'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT lives_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      ' ADJ-401 ', ' F-401 ', 100, 30, 70, '  Se tecleó mal el cobrado hoy  '
    )
  $$,
  'El Administrador ajusta una orden Pendiente'
);

SELECT results_eq(
  $$
    SELECT order_number, invoice_number, total_usd, paid_today_usd, financed_usd,
           service_fee_pct, advance_fee_pct, expected_net_usd, status
    FROM public.cashea_orders
    WHERE id = '3d000000-0000-0000-0000-000000000201'
  $$,
  $$
    VALUES (
      'ADJ-401'::text, 'F-401'::text, 100::numeric(12,2), 30::numeric(12,2), 70::numeric(12,2),
      4::numeric(5,2), 4::numeric(5,2), 63.20::numeric(12,2), 'pending'::public.cashea_order_status
    )
  $$,
  'La orden guarda los datos nuevos y recalcula el Neto esperado con sus porcentajes copiados'
);

SELECT results_eq(
  $$
    SELECT previous_order_number, new_order_number, previous_invoice_number, new_invoice_number,
           previous_total_usd, new_total_usd, previous_paid_today_usd, new_paid_today_usd,
           previous_financed_usd, new_financed_usd, note, created_by::text, created_at = now()
    FROM public.cashea_order_adjustments
    WHERE order_id = '3d000000-0000-0000-0000-000000000201'
  $$,
  $$
    VALUES (
      'ADJ-TYPO'::text, 'ADJ-401'::text, 'F-40I'::text, 'F-401'::text,
      100::numeric(12,2), 100::numeric(12,2), 40::numeric(12,2), 30::numeric(12,2),
      60::numeric(12,2), 70::numeric(12,2), 'Se tecleó mal el cobrado hoy'::text,
      'a0000000-0000-0000-0000-000000000001'::text, true
    )
  $$,
  'El ajuste deja la auditoría con valores anteriores y nuevos, nota, usuario y fecha'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      'ADJ-401', 'F-401', 100, 30, 60, 'Suma que no cuadra'
    )
  $$,
  'P0001',
  'Cobrado hoy más Monto financiado debe coincidir con el total de la Orden Cashea',
  'La suma debe coincidir con el total'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      'ADJ-401', 'F-401', 120, 10, 110, 'Financiado mayor que la venta'
    )
  $$,
  'P0001',
  'El Monto financiado no puede superar el total de la Venta',
  'El Monto financiado no supera el total de la Venta'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      'ADJ-401', 'F-401', 100, 30, 70.001, 'Tres decimales'
    )
  $$,
  'P0001',
  'Los montos de la Orden Cashea admiten como máximo dos decimales',
  'Los montos admiten como máximo dos decimales'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      'ADJ-TAKEN', 'F-401', 100, 30, 70, 'Número repetido'
    )
  $$,
  'P0001',
  'Ya existe una Orden Cashea con ese número en este negocio',
  'El número de orden no se repite entre las órdenes no anuladas'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      'ADJ-401', 'F-401', 100, 30, 70, 'Sin cambios'
    )
  $$,
  'P0001',
  'El ajuste no cambia ningún dato de la Orden Cashea',
  'Un ajuste sin cambios se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000201',
      'ADJ-401', 'F-402', 100, 30, 70, '   '
    )
  $$,
  'P0001',
  'La nota del ajuste es requerida',
  'Una nota en blanco se rechaza'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000202',
      'ADJ-COLLECTED', 'F-402', 40, 10, 30, 'Cobrada'
    )
  $$,
  'P0001',
  'Una Orden Cashea Cobrada no se ajusta: primero revierte su depósito',
  'Una orden Cobrada no se ajusta'
);

SELECT throws_ok(
  $$
    SELECT public.adjust_cashea_order(
      '3d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000204',
      'ADJ-VOIDED', 'F-404', 100, 30, 70, 'Anulada'
    )
  $$,
  'P0001',
  'Una Orden Cashea Anulada no se ajusta',
  'Una orden Anulada no se ajusta'
);

SELECT is(
  (SELECT count(*)::integer FROM public.cashea_order_adjustments WHERE business_id = '3d000000-0000-0000-0000-000000000001'),
  1,
  'Los intentos rechazados no dejan auditoría'
);

SELECT results_eq(
  $$
    SELECT to_jsonb(c)
    FROM public.cash_closes c
    WHERE business_id = '3d000000-0000-0000-0000-000000000001'
  $$,
  $$ SELECT to_jsonb(c) FROM closed_day c $$,
  'Ajustar una orden de un día cerrado no cambia su cierre guardado'
);

SELECT * FROM finish();
ROLLBACK;
