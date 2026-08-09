-- ============================================================================
-- TEST SUITE: billed_operations_cash_closes
-- Requires the deterministic local seed.
-- ============================================================================

BEGIN;

SELECT plan(9);

DELETE FROM public.inventory_movements
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
)
  AND date = (now() AT TIME ZONE 'America/Caracas')::date;

DELETE FROM public.transactions
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
)
  AND date = (now() AT TIME ZONE 'America/Caracas')::date;

DELETE FROM public.return_items
WHERE return_id IN (
  SELECT id
  FROM public.returns
  WHERE business_id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002'
  )
    AND date = (now() AT TIME ZONE 'America/Caracas')::date
);

DELETE FROM public.returns
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
)
  AND date = (now() AT TIME ZONE 'America/Caracas')::date;

DELETE FROM public.sales
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
)
  AND date = (now() AT TIME ZONE 'America/Caracas')::date;

DELETE FROM public.cash_closes
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
)
  AND date = (now() AT TIME ZONE 'America/Caracas')::date;

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
VALUES
  (
    '31000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'CLOSE-OPS-01',
    'Producto principal para Cierre de Caja',
    20,
    20,
    true
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'CLOSE-OPS-02',
    'Producto secundario para Cierre de Caja',
    20,
    30,
    true
  ),
  (
    '31000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'CLOSE-OPS-OTHER',
    'Producto aislado de otro Negocio',
    20,
    40,
    true
  );

SELECT set_config('app.suppress_log_entry', 'false', true);

INSERT INTO public.cash_closes (
  id,
  business_id,
  date,
  total_transactions,
  total_units_sold,
  total_usd,
  total_ves,
  exchange_rate,
  closed_by
)
VALUES (
  '31000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000001',
  (now() AT TIME ZONE 'America/Caracas')::date - 10,
  7,
  9,
  180,
  16200,
  90,
  'a0000000-0000-0000-0000-000000000001'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT lives_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000001',
      '[
        {"product_id":"31000000-0000-0000-0000-000000000001","quantity":1,"price_usd":20,"price_ves":1800},
        {"product_id":"31000000-0000-0000-0000-000000000002","quantity":2,"price_usd":30,"price_ves":2700}
      ]'::jsonb,
      90
    )
  $$,
  'Una Venta multi-Renglón se registra para el resumen'
);

SELECT lives_ok(
  $$
    SELECT public.process_return(
      '10000000-0000-0000-0000-000000000001',
      'exchange',
      '[{"product_id":"31000000-0000-0000-0000-000000000001","quantity":1,"price_usd":20,"price_ves":1800}]'::jsonb,
      '[
        {"product_id":"31000000-0000-0000-0000-000000000001","quantity":1,"price_usd":20,"price_ves":1800},
        {"product_id":"31000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}
      ]'::jsonb,
      90,
      'Cambio multi-Producto para conteo de Cierre'
    )
  $$,
  'Un Cambio multi-Producto se registra para el resumen'
);

SELECT lives_ok(
  $$
    SELECT public.process_return(
      '10000000-0000-0000-0000-000000000001',
      'refund',
      '[{"product_id":"31000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      null,
      90,
      'Devolución sin reemplazo para conteo de Cierre'
    )
  $$,
  'Una devolución sin reemplazo se registra para el resumen'
);

SELECT lives_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000002',
      '[{"product_id":"31000000-0000-0000-0000-000000000003","quantity":1,"price_usd":40,"price_ves":3600}]'::jsonb,
      90
    )
  $$,
  'Una Venta de otro Negocio se registra para comprobar aislamiento'
);

SELECT is(
  (
    SELECT billed_operations
    FROM public.get_cash_close_summary(
      '10000000-0000-0000-0000-000000000001',
      (now() AT TIME ZONE 'America/Caracas')::date
    )
  ),
  2,
  'El resumen cuenta una Venta y un Cambio como dos Operaciones facturadas'
);

SELECT is(
  (
    SELECT billed_operations
    FROM public.get_cash_close_summary(
      '10000000-0000-0000-0000-000000000002',
      (now() AT TIME ZONE 'America/Caracas')::date
    )
  ),
  1,
  'El resumen mantiene aisladas las Operaciones facturadas por Negocio'
);

SELECT lives_ok(
  $$
    SELECT public.generate_daily_cash_close(
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'El nuevo Cierre de Caja se genera con el resumen compartido'
);

SELECT is(
  (
    SELECT total_billed_operations
    FROM public.cash_closes
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
      AND date = (now() AT TIME ZONE 'America/Caracas')::date
  ),
  2,
  'El nuevo Cierre persiste el conteo exacto separado del conteo heredado'
);

SELECT is(
  (
    SELECT total_billed_operations
    FROM public.cash_closes
    WHERE id = '31000000-0000-0000-0000-000000000010'
  ),
  null,
  'El Cierre histórico permanece intacto para que la interfaz use el fallback heredado'
);

SELECT * FROM finish();

ROLLBACK;
