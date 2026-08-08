-- ============================================================================
-- TEST SUITE: atomic_multi_line_sales
-- Requires the deterministic local seed.
-- ============================================================================

BEGIN;

SELECT plan(25);
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
    '29000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'SALE-ATOMIC-01',
    'Producto para venta atómica 1',
    10,
    20,
    true
  ),
  (
    '29000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'SALE-ATOMIC-02',
    'Producto para venta atómica 2',
    8,
    35,
    true
  ),
  (
    '29000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'SALE-ATOMIC-03',
    'Producto aislado de otro negocio',
    6,
    18,
    true
  ),
  (
    '29000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'SALE-ATOMIC-04',
    'Producto inactivo en liquidación',
    4,
    25,
    false
  );

SELECT set_config('app.suppress_log_entry', 'false', true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT lives_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000001',
      '[
        {"product_id":"29000000-0000-0000-0000-000000000001","quantity":2,"price_usd":20,"price_ves":1800},
        {"product_id":"29000000-0000-0000-0000-000000000002","quantity":3,"price_usd":35,"price_ves":3150}
      ]'::jsonb,
      90
    )
  $$,
  'Una confirmación multi-Producto crea una Venta atómica'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.sales
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
      AND user_id = 'a0000000-0000-0000-0000-000000000002'
  ),
  1,
  'La confirmación crea una sola cabecera de Venta'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.transactions
    WHERE product_id IN (
      '29000000-0000-0000-0000-000000000001',
      '29000000-0000-0000-0000-000000000002'
    )
      AND sale_id IS NOT NULL
  ),
  2,
  'La Venta contiene sus dos Renglones'
);

SELECT is(
  (
    SELECT count(DISTINCT sale_id)::integer
    FROM public.transactions
    WHERE product_id IN (
      '29000000-0000-0000-0000-000000000001',
      '29000000-0000-0000-0000-000000000002'
    )
  ),
  1,
  'Todos los Renglones comparten la identidad de la Venta'
);

SELECT results_eq(
  $$
    SELECT id, stock
    FROM public.products
    WHERE id IN (
      '29000000-0000-0000-0000-000000000001',
      '29000000-0000-0000-0000-000000000002'
    )
    ORDER BY id
  $$,
  $$
    VALUES
      ('29000000-0000-0000-0000-000000000001'::uuid, 8),
      ('29000000-0000-0000-0000-000000000002'::uuid, 5)
  $$,
  'La Venta reduce el stock de cada Renglón'
);

SELECT throws_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000001',
      '[]'::jsonb,
      90
    )
  $$,
  'P0001',
  'La Venta debe contener al menos un Renglón',
  'Una Venta vacía se rechaza antes de persistir'
);

SELECT throws_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000001',
      '{"product_id":"29000000-0000-0000-0000-000000000001"}'::jsonb,
      90
    )
  $$,
  'P0001',
  'La Venta debe contener una lista de Renglones',
  'Un payload inválido se rechaza antes de persistir'
);

SELECT throws_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000001',
      '[
        {"product_id":"29000000-0000-0000-0000-000000000001","quantity":1,"price_usd":20,"price_ves":1800},
        {"product_id":"29000000-0000-0000-0000-000000000002","quantity":99,"price_usd":35,"price_ves":3150}
      ]'::jsonb,
      90
    )
  $$,
  'P0001',
  'Existencia insuficiente para el producto SALE-ATOMIC-02',
  'Un Renglón sin stock rechaza la Venta completa'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.sales
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
      AND user_id = 'a0000000-0000-0000-0000-000000000002'
  ),
  1,
  'La Venta fallida no deja una cabecera parcial'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.transactions
    WHERE product_id IN (
      '29000000-0000-0000-0000-000000000001',
      '29000000-0000-0000-0000-000000000002'
    )
  ),
  2,
  'La Venta fallida no deja Renglones parciales'
);

SELECT results_eq(
  $$
    SELECT id, stock
    FROM public.products
    WHERE id IN (
      '29000000-0000-0000-0000-000000000001',
      '29000000-0000-0000-0000-000000000002'
    )
    ORDER BY id
  $$,
  $$
    VALUES
      ('29000000-0000-0000-0000-000000000001'::uuid, 8),
      ('29000000-0000-0000-0000-000000000002'::uuid, 5)
  $$,
  'La Venta fallida no reduce stock parcialmente'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.inventory_movements
    WHERE type = 'exit'
      AND product_id IN (
        '29000000-0000-0000-0000-000000000001',
        '29000000-0000-0000-0000-000000000002'
      )
  ),
  2,
  'La Venta fallida no deja Movimientos parciales'
);

SELECT throws_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"29000000-0000-0000-0000-000000000003","quantity":1,"price_usd":18,"price_ves":1620}]'::jsonb,
      90
    )
  $$,
  'P0001',
  'Producto inexistente o perteneciente a otro negocio',
  'Un Producto de otro Negocio rechaza la Venta completa'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.sales
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
  ),
  1,
  'La validación de pertenencia tampoco deja cabecera parcial'
);

SELECT throws_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000002',
      '[{"product_id":"29000000-0000-0000-0000-000000000003","quantity":1,"price_usd":18,"price_ves":1620}]'::jsonb,
      90
    )
  $$,
  'P0001',
  'Negocio inexistente, inactivo o no autorizado',
  'Un usuario no puede registrar una Venta en otro Negocio'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);

SELECT lives_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000002',
      '[{"product_id":"29000000-0000-0000-0000-000000000003","quantity":1,"price_usd":18,"price_ves":1620}]'::jsonb,
      90
    )
  $$,
  'Un usuario autorizado registra la Venta de su Negocio'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT is(
  (SELECT count(*)::integer FROM public.sales),
  1,
  'RLS oculta las Ventas de otros Negocios'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.transactions transaction_line
    JOIN public.sales sale
      ON sale.id = transaction_line.sale_id
    WHERE transaction_line.business_id <> sale.business_id
  ),
  0,
  'La relación compuesta impide asociar Renglones y Ventas de Negocios distintos'
);

SELECT lives_ok(
  $$
    SELECT public.create_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"29000000-0000-0000-0000-000000000004","quantity":2,"price_usd":25,"price_ves":2250}]'::jsonb,
      90
    )
  $$,
  'Un Producto inactivo con stock puede liquidarse'
);

SELECT is(
  (
    SELECT stock
    FROM public.products
    WHERE id = '29000000-0000-0000-0000-000000000004'
  ),
  2,
  'La liquidación del Producto inactivo reduce su stock'
);

SELECT lives_ok(
  $$
    INSERT INTO public.transactions (
      business_id,
      product_id,
      quantity,
      price_usd,
      price_ves,
      exchange_rate,
      user_id
    )
    VALUES (
      '10000000-0000-0000-0000-000000000001',
      '29000000-0000-0000-0000-000000000001',
      1,
      20,
      1800,
      90,
      'a0000000-0000-0000-0000-000000000002'
    )
  $$,
  'El fixture histórico conserva un Renglón sin Venta asociada'
);

SELECT is(
  (
    SELECT
      count(DISTINCT sale_id) FILTER (WHERE sale_id IS NOT NULL)
      + count(*) FILTER (WHERE sale_id IS NULL AND return_id IS NULL)
    FROM public.transactions
    WHERE product_id IN (
      '29000000-0000-0000-0000-000000000001',
      '29000000-0000-0000-0000-000000000002',
      '29000000-0000-0000-0000-000000000004'
    )
  )::integer,
  3,
  'El conteo suma Ventas completas y un fallback por Renglón histórico'
);

SELECT ok(
  (
    SELECT sale_id IS NULL
    FROM public.transactions
    WHERE id = 'd0000000-0000-0000-0000-000000000001'
  ),
  'Los Renglones históricos existentes permanecen sin asociación'
);

RESET ROLE;

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.create_sale(uuid,jsonb,numeric)',
    'EXECUTE'
  ),
  'anon no puede ejecutar la RPC de Ventas'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.sales', 'INSERT'),
  'authenticated no puede crear cabeceras de Venta fuera de la RPC'
);

SELECT * FROM finish();

ROLLBACK;
