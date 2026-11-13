-- ============================================================================
-- TEST SUITE: cash_close_cashea
-- El cierre de caja separa el Por cobrar Cashea y el Cashea anulado por
-- devolución (REQ-004, D-05, D-14).
-- Requires the deterministic local seed: Zapatería Estilos has no activity
-- today and no Órdenes Cashea before CURRENT_DATE - 3.
-- ============================================================================

BEGIN;

SELECT plan(14);

SELECT set_config('test.today', ((now() AT TIME ZONE 'America/Caracas')::date)::text, true);

-- Hoy queda vacío en Estilos aunque el seed cambie.
DELETE FROM public.cashea_orders
WHERE business_id = '10000000-0000-0000-0000-000000000002'
  AND sale_date = current_setting('test.today')::date;
DELETE FROM public.inventory_movements
WHERE business_id = '10000000-0000-0000-0000-000000000002'
  AND date = current_setting('test.today')::date;
DELETE FROM public.transactions
WHERE business_id = '10000000-0000-0000-0000-000000000002'
  AND date = current_setting('test.today')::date;
DELETE FROM public.sales
WHERE business_id = '10000000-0000-0000-0000-000000000002'
  AND date = current_setting('test.today')::date;
DELETE FROM public.cash_closes
WHERE business_id = '10000000-0000-0000-0000-000000000002'
  AND date = current_setting('test.today')::date;

SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES (
  '3a000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'CLOSE-CASHEA-01',
  'Producto para el cierre con Cashea',
  10,
  185.60,
  true
);

SELECT set_config('app.suppress_log_entry', 'false', true);

-- ─── Órdenes Cashea con datos directos (fechas pasadas) ─────────────────────
-- Día D-10: una orden Pendiente y dos anuladas el mismo día de su venta.
-- Día D-12: una orden anulada por «Devolución del cliente» en D-11 y otra
-- anulada por «Error de registro» en D-11.

INSERT INTO public.sales (id, business_id, user_id, date)
VALUES
  ('3a000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', current_setting('test.today')::date - 10),
  ('3a000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', current_setting('test.today')::date - 10),
  ('3a000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', current_setting('test.today')::date - 10),
  ('3a000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', current_setting('test.today')::date - 12),
  ('3a000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', current_setting('test.today')::date - 12);

INSERT INTO public.cashea_orders (
  business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
  total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd,
  status, voided_at, voided_by, void_reason, void_note, created_by
)
VALUES
  (
    '10000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-000000000101',
    current_setting('test.today')::date - 10, 50, 'CLOSE-D10-PENDING', 'F-101',
    30, 20, 10, 4, 4, 8.40,
    'pending', null, null, null, null, 'a0000000-0000-0000-0000-000000000004'
  ),
  (
    '10000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-000000000102',
    current_setting('test.today')::date - 10, 50, 'CLOSE-D10-RETURN', 'F-102',
    40, 20, 20, 4, 4, 17.60,
    'voided',
    ((current_setting('test.today')::date - 10)::timestamp + time '16:00') AT TIME ZONE 'America/Caracas',
    'a0000000-0000-0000-0000-000000000001', 'customer_return', 'Devuelto el mismo día',
    'a0000000-0000-0000-0000-000000000004'
  ),
  (
    '10000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-000000000103',
    current_setting('test.today')::date - 10, 50, 'CLOSE-D10-ERROR', 'F-103',
    60, 20, 40, 4, 4, 36.00,
    'voided',
    ((current_setting('test.today')::date - 10)::timestamp + time '17:00') AT TIME ZONE 'America/Caracas',
    'a0000000-0000-0000-0000-000000000001', 'registration_error', 'Registrada por error',
    'a0000000-0000-0000-0000-000000000004'
  ),
  (
    '10000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-000000000104',
    current_setting('test.today')::date - 12, 80, 'CLOSE-D12-RETURN', 'F-104',
    100, 40, 60, 4, 4, 53.60,
    'voided',
    ((current_setting('test.today')::date - 11)::timestamp + time '10:00') AT TIME ZONE 'America/Caracas',
    'a0000000-0000-0000-0000-000000000001', 'customer_return', 'El cliente devolvió al día siguiente',
    'a0000000-0000-0000-0000-000000000004'
  ),
  (
    '10000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-000000000105',
    current_setting('test.today')::date - 12, 80, 'CLOSE-D12-ERROR', 'F-105',
    50, 25, 25, 4, 4, 22.00,
    'voided',
    ((current_setting('test.today')::date - 11)::timestamp + time '11:00') AT TIME ZONE 'America/Caracas',
    'a0000000-0000-0000-0000-000000000001', 'registration_error', 'Número de orden equivocado',
    'a0000000-0000-0000-0000-000000000004'
  );

CREATE TEMP TABLE historical_closes ON COMMIT DROP AS
SELECT *
FROM public.cash_closes
WHERE business_id = '10000000-0000-0000-0000-000000000002';

GRANT SELECT ON historical_closes TO authenticated;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);

-- ─── Venta Cashea de hoy: ejemplo de REQ-004 ────────────────────────────────

SELECT lives_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000002',
      '[{"product_id":"3a000000-0000-0000-0000-000000000001","quantity":1,"price_usd":185.60,"price_ves":7424.00}]'::jsonb,
      40,
      '{"order_number":"CLOSE-TODAY-1","invoice_number":"F-201","total_usd":185.60,"paid_today_usd":92.80,"financed_usd":92.80}'::jsonb
    )
  $$,
  'Se registra la Venta Cashea de $185.60 con $92.80 financiados'
);

SELECT results_eq(
  $$
    SELECT total_usd, cashea_receivable_usd, cashea_voided_return_usd, net_usd
    FROM public.get_cash_close_summary('10000000-0000-0000-0000-000000000002')
  $$,
  $$ VALUES (185.60::numeric, 92.80::numeric, 0::numeric, 92.80::numeric) $$,
  'El resumen muestra Total facturado $185.60, Por cobrar Cashea $92.80 y Total producido $92.80'
);

SELECT results_eq(
  $$
    SELECT total_ves, cashea_receivable_ves, cashea_voided_return_ves, net_ves
    FROM public.get_cash_close_summary('10000000-0000-0000-0000-000000000002')
  $$,
  $$ VALUES (7424.00::numeric, 3712.00::numeric, 0::numeric, 3712.00::numeric) $$,
  'El Por cobrar Cashea en Bs. usa la tasa de la venta (40), no la vigente (88.25)'
);

SELECT is(
  (
    SELECT total_produced_usd
    FROM public.get_dashboard_daily_metrics('10000000-0000-0000-0000-000000000002')
  ),
  92.80::numeric,
  'El Total producido del dashboard diario coincide con el resumen del cierre'
);

-- ─── Generación del cierre ──────────────────────────────────────────────────

SELECT lives_ok(
  $$ SELECT public.generate_daily_cash_close('10000000-0000-0000-0000-000000000002') $$,
  'Se genera el cierre del día con Cashea'
);

SELECT results_eq(
  $$
    SELECT total_usd, total_ves, cashea_receivable_usd, cashea_receivable_ves,
      cashea_voided_return_usd, cashea_voided_return_ves
    FROM public.cash_closes
    WHERE business_id = '10000000-0000-0000-0000-000000000002'
      AND date = current_setting('test.today')::date
  $$,
  $$
    VALUES (
      92.80::numeric(12,2), 3712.00::numeric(12,2), 92.80::numeric(12,2), 3712.00::numeric(12,2),
      0::numeric(12,2), 0::numeric(12,2)
    )
  $$,
  'El cierre guarda el Total producido descontado y el desglose Cashea'
);

SELECT lives_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000002',
      '[{"product_id":"3a000000-0000-0000-0000-000000000001","quantity":1,"price_usd":100,"price_ves":4000}]'::jsonb,
      40,
      '{"order_number":"CLOSE-TODAY-2","invoice_number":"F-202","total_usd":100,"paid_today_usd":40,"financed_usd":60}'::jsonb
    )
  $$,
  'Se registra una segunda Venta Cashea después del primer cierre'
);

SELECT lives_ok(
  $$ SELECT public.generate_daily_cash_close('10000000-0000-0000-0000-000000000002') $$,
  'Se cierra por segunda vez el mismo día'
);

SELECT results_eq(
  $$
    SELECT total_usd, total_ves, cashea_receivable_usd, cashea_receivable_ves,
      cashea_voided_return_usd, cashea_voided_return_ves
    FROM public.cash_closes
    WHERE business_id = '10000000-0000-0000-0000-000000000002'
      AND date = current_setting('test.today')::date
  $$,
  $$
    VALUES (
      132.80::numeric(12,2), 5312.00::numeric(12,2), 152.80::numeric(12,2), 6112.00::numeric(12,2),
      0::numeric(12,2), 0::numeric(12,2)
    )
  $$,
  'El segundo cierre del mismo día actualiza el Total producido y el desglose Cashea'
);

SELECT is_empty(
  $$
    SELECT *
    FROM public.cash_closes
    WHERE business_id = '10000000-0000-0000-0000-000000000002'
      AND date < current_setting('test.today')::date
    EXCEPT
    SELECT *
    FROM historical_closes
  $$,
  'Los cierres previos no cambian'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.cash_closes
    WHERE business_id = '10000000-0000-0000-0000-000000000002'
      AND date < current_setting('test.today')::date
      AND (
        cashea_receivable_usd IS NOT NULL
        OR cashea_receivable_ves IS NOT NULL
        OR cashea_voided_return_usd IS NOT NULL
        OR cashea_voided_return_ves IS NOT NULL
      )
  ),
  0,
  'Los cierres previos conservan null en el desglose Cashea'
);

-- ─── Qué órdenes cuentan ────────────────────────────────────────────────────

SELECT results_eq(
  $$
    SELECT cashea_receivable_usd, cashea_receivable_ves, cashea_voided_return_usd
    FROM public.get_cash_close_summary(
      '10000000-0000-0000-0000-000000000002',
      current_setting('test.today')::date - 10
    )
  $$,
  $$ VALUES (10::numeric, 500::numeric, 0::numeric) $$,
  'Una orden anulada el mismo día de su venta deja de contar, con cualquier motivo'
);

SELECT results_eq(
  $$
    SELECT cashea_receivable_usd, cashea_receivable_ves, cashea_voided_return_usd
    FROM public.get_cash_close_summary(
      '10000000-0000-0000-0000-000000000002',
      current_setting('test.today')::date - 12
    )
  $$,
  $$ VALUES (60::numeric, 4800::numeric, 0::numeric) $$,
  'La anulación por devolución en un día posterior conserva el Por cobrar Cashea del día de la venta; la de Error de registro no cuenta'
);

SELECT results_eq(
  $$
    SELECT
      cashea_receivable_usd,
      cashea_voided_return_usd,
      cashea_voided_return_ves,
      net_usd - (total_usd - total_returns_usd),
      net_ves - (total_ves - total_returns_ves)
    FROM public.get_cash_close_summary(
      '10000000-0000-0000-0000-000000000002',
      current_setting('test.today')::date - 11
    )
  $$,
  $$ VALUES (0::numeric, 60::numeric, 4800::numeric, 60::numeric, 4800::numeric) $$,
  'El día de la anulación por devolución suma al Total producido el Cashea anulado por devolución con la tasa de la venta'
);

SELECT * FROM finish();

ROLLBACK;
