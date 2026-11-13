-- ============================================================================
-- TEST SUITE: cashea_orders
-- Venta Cashea con ingreso manual (create_cashea_sale) y esquema del módulo.
-- Requires the deterministic local seed.
-- ============================================================================

BEGIN;

SELECT plan(40);
SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES
  ('39000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CASHEA-01', 'Producto Venta Cashea 1', 10, 50, true),
  ('39000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'CASHEA-02', 'Producto Venta Cashea 2', 5, 30, true),
  ('39000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'CASHEA-03', 'Producto Venta Cashea Estilos', 5, 50, true),
  ('39000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'CASHEA-04', 'Producto Venta Cashea sin existencia', 1, 50, true);

SELECT set_config('app.suppress_log_entry', 'false', true);

-- ─── Esquema ────────────────────────────────────────────────────────────────

SELECT results_eq(
  $$
    SELECT cashea_service_fee_pct, cashea_advance_fee_pct
    FROM public.app_settings
    ORDER BY business_id
  $$,
  $$ VALUES (4.00::numeric(5,2), 4.00::numeric(5,2)), (4.00::numeric(5,2), 4.00::numeric(5,2)) $$,
  'Cada negocio arranca con Comisiones Cashea de 4% y 4%'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.cash_closes
    WHERE cashea_receivable_usd IS NOT NULL
      OR cashea_receivable_ves IS NOT NULL
      OR cashea_voided_return_usd IS NOT NULL
      OR cashea_voided_return_ves IS NOT NULL
  ),
  0,
  'Los cierres existentes quedan con el desglose Cashea en null'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.create_cashea_sale(uuid,jsonb,numeric,jsonb)', 'EXECUTE'),
  'anon no puede ejecutar create_cashea_sale'
);

SELECT ok(
  NOT has_function_privilege('authenticated', 'private.insert_cashea_order(uuid,uuid,jsonb)', 'EXECUTE'),
  'El helper interno insert_cashea_order no es ejecutable por authenticated'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.cashea_orders', 'SELECT')
    AND NOT has_table_privilege('anon', 'public.cashea_deposits', 'SELECT')
    AND NOT has_table_privilege('anon', 'public.cashea_order_adjustments', 'SELECT'),
  'anon no puede leer las tablas Cashea'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.cashea_orders', 'INSERT')
    AND NOT has_table_privilege('authenticated', 'public.cashea_orders', 'UPDATE')
    AND NOT has_table_privilege('authenticated', 'public.cashea_orders', 'DELETE')
    AND NOT has_table_privilege('authenticated', 'public.cashea_deposits', 'INSERT')
    AND NOT has_table_privilege('authenticated', 'public.cashea_order_adjustments', 'INSERT'),
  'authenticated solo escribe en las tablas Cashea mediante RPC'
);

SELECT ok(
  NOT has_column_privilege('authenticated', 'public.app_settings', 'cashea_service_fee_pct', 'UPDATE')
    AND NOT has_column_privilege('authenticated', 'public.app_settings', 'cashea_advance_fee_pct', 'UPDATE'),
  'authenticated no puede actualizar las Comisiones Cashea directamente'
);

-- ─── Empleado registra una Venta Cashea ─────────────────────────────────────

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT set_config(
  'test.cashea_sale_id',
  public.create_cashea_sale(
    '10000000-0000-0000-0000-000000000001',
    '[{"product_id":"39000000-0000-0000-0000-000000000001","quantity":2,"price_usd":50,"price_ves":4500}]'::jsonb,
    90,
    '{"order_number":" 7001 ","invoice_number":" 551-0001 ","total_usd":100,"paid_today_usd":40,"financed_usd":60}'::jsonb
  )::text,
  true
);

SELECT results_eq(
  $$
    SELECT
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
      AND order_number = '7001'
  $$,
  $$
    VALUES (
      current_setting('test.cashea_sale_id'),
      (now() AT TIME ZONE 'America/Caracas')::date,
      90.0000::numeric(12,4),
      '7001'::text,
      '551-0001'::text,
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
  'El empleado crea la Orden Cashea y la lee: textos recortados, tasa y porcentajes copiados y Neto esperado calculado'
);

SELECT results_eq(
  $$
    SELECT
      (SELECT stock FROM public.products WHERE id = '39000000-0000-0000-0000-000000000001'),
      (
        SELECT count(*)::integer
        FROM public.transactions
        WHERE sale_id = current_setting('test.cashea_sale_id')::uuid
      )
  $$,
  $$ VALUES (8, 1) $$,
  'La Venta Cashea descuenta el inventario y registra sus Renglones'
);

SELECT set_config(
  'test.cashea_full_sales_baseline',
  (SELECT count(*)::text FROM public.sales WHERE business_id = '10000000-0000-0000-0000-000000000001'),
  true
);

-- ─── Unicidad del número de orden ───────────────────────────────────────────

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7001","invoice_number":"551-0002","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'Ya existe una Orden Cashea con ese número en este negocio',
  'Un número de orden repetido entre órdenes no anuladas del negocio se rechaza con mensaje propio'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);

SELECT lives_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000002',
      '[{"product_id":"39000000-0000-0000-0000-000000000003","quantity":1,"price_usd":50,"price_ves":4500}]'::jsonb,
      90,
      '{"order_number":"7001","invoice_number":"551-0001","total_usd":50,"paid_today_usd":25,"financed_usd":25}'::jsonb
    )
  $$,
  'El mismo número de orden se permite en el otro negocio'
);

RESET ROLE;

UPDATE public.cashea_orders
SET status = 'voided',
    voided_at = now(),
    voided_by = 'a0000000-0000-0000-0000-000000000001',
    void_reason = 'registration_error',
    void_note = 'Prueba de reutilización'
WHERE business_id = '10000000-0000-0000-0000-000000000001'
  AND order_number = '7001';

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT lives_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7001","invoice_number":"551-0003","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'El número de una orden anulada puede volver a usarse'
);

SELECT set_config(
  'test.cashea_full_sales_baseline',
  (SELECT count(*)::text FROM public.sales WHERE business_id = '10000000-0000-0000-0000-000000000001'),
  true
);
SELECT set_config(
  'test.cashea_full_orders_baseline',
  (SELECT count(*)::text FROM public.cashea_orders WHERE business_id = '10000000-0000-0000-0000-000000000001'),
  true
);

-- ─── Reglas de REQ-001 repetidas en la RPC ──────────────────────────────────

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7100","invoice_number":"551-0100","total_usd":30,"paid_today_usd":10,"financed_usd":19.98}'::jsonb
    )
  $$,
  'P0001',
  'Cobrado hoy más Monto financiado debe coincidir con el total de la Orden Cashea',
  'Se rechaza una suma que difiere del total en más de $0.01'
);

SELECT lives_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7101","invoice_number":"551-0101","total_usd":30,"paid_today_usd":10,"financed_usd":19.99}'::jsonb
    )
  $$,
  'Se acepta una suma dentro de la tolerancia de $0.01'
);

SELECT set_config(
  'test.cashea_full_sales_baseline',
  (SELECT count(*)::text FROM public.sales WHERE business_id = '10000000-0000-0000-0000-000000000001'),
  true
);
SELECT set_config(
  'test.cashea_full_orders_baseline',
  (SELECT count(*)::text FROM public.cashea_orders WHERE business_id = '10000000-0000-0000-0000-000000000001'),
  true
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7102","invoice_number":"551-0102","total_usd":40,"paid_today_usd":5,"financed_usd":35}'::jsonb
    )
  $$,
  'P0001',
  'El Monto financiado no puede superar el total de la Venta',
  'Se rechaza un Monto financiado mayor que el total de la Venta'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7103","invoice_number":"551-0103","total_usd":30,"paid_today_usd":10.001,"financed_usd":19.999}'::jsonb
    )
  $$,
  'P0001',
  'Los montos de la Orden Cashea admiten como máximo dos decimales',
  'Se rechazan montos con más de dos decimales'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7104","invoice_number":"551-0104","total_usd":0,"paid_today_usd":0,"financed_usd":0}'::jsonb
    )
  $$,
  'P0001',
  'El total de la Orden Cashea debe ser mayor a 0',
  'Se rechaza un total igual a cero'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7105","invoice_number":"551-0105","total_usd":30,"paid_today_usd":30,"financed_usd":0}'::jsonb
    )
  $$,
  'P0001',
  'El Monto financiado debe ser mayor a 0',
  'Se rechaza un Monto financiado igual a cero'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7106","invoice_number":"551-0106","total_usd":30,"paid_today_usd":-5,"financed_usd":35}'::jsonb
    )
  $$,
  'P0001',
  'El monto Cobrado hoy no puede ser negativo',
  'Se rechaza un Cobrado hoy negativo'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '[]'::jsonb
    )
  $$,
  'P0001',
  'Los datos de la Orden Cashea son requeridos',
  'Se rechaza un p_cashea que no es un objeto'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      NULL
    )
  $$,
  'P0001',
  'Los datos de la Orden Cashea son requeridos',
  'Se rechaza un p_cashea nulo'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7107","invoice_number":"551-0107","total_usd":"30","paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'La Orden Cashea debe incluir número de orden, número de factura y montos válidos',
  'Se rechaza un monto enviado como texto'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7108","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'La Orden Cashea debe incluir número de orden, número de factura y montos válidos',
  'Se rechaza una Orden Cashea sin número de factura'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"   ","invoice_number":"551-0109","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'El número de orden Cashea es requerido y admite como máximo 40 caracteres',
  'Se rechaza un número de orden en blanco'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      jsonb_build_object(
        'order_number', '7110',
        'invoice_number', repeat('9', 41),
        'total_usd', 30,
        'paid_today_usd', 10,
        'financed_usd', 20
      )
    )
  $$,
  'P0001',
  'El número de factura es requerido y admite como máximo 40 caracteres',
  'Se rechaza un número de factura de más de 40 caracteres'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7114","invoice_number":"551-0114","total_usd":10000000000,"paid_today_usd":9999999990,"financed_usd":10}'::jsonb
    )
  $$,
  'P0001',
  'Los montos de la Orden Cashea exceden el máximo permitido',
  'Se rechaza un monto que no cabe en la columna con un mensaje propio'
);

-- ─── Atomicidad ─────────────────────────────────────────────────────────────

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000004","quantity":2,"price_usd":50,"price_ves":4500}]'::jsonb,
      90,
      '{"order_number":"7111","invoice_number":"551-0111","total_usd":100,"paid_today_usd":50,"financed_usd":50}'::jsonb
    )
  $$,
  'P0001',
  'Existencia insuficiente para el producto CASHEA-04',
  'Una Venta Cashea sin existencia suficiente se rechaza'
);

SELECT results_eq(
  $$
    SELECT
      (SELECT count(*)::integer FROM public.sales WHERE business_id = '10000000-0000-0000-0000-000000000001'),
      (SELECT count(*)::integer FROM public.cashea_orders WHERE business_id = '10000000-0000-0000-0000-000000000001'),
      (SELECT stock FROM public.products WHERE id = '39000000-0000-0000-0000-000000000002'),
      (SELECT stock FROM public.products WHERE id = '39000000-0000-0000-0000-000000000004')
  $$,
  $$
    VALUES (
      current_setting('test.cashea_full_sales_baseline')::integer,
      current_setting('test.cashea_full_orders_baseline')::integer,
      3,
      1
    )
  $$,
  'Si algo falla no queda Venta, Orden Cashea ni existencia descontada'
);

-- ─── Aislamiento entre negocios ─────────────────────────────────────────────

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.cashea_orders
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
  ),
  0,
  'Un usuario de Estilos no ve las Órdenes Cashea de Full Calzado'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.cashea_orders
    WHERE business_id = '10000000-0000-0000-0000-000000000002'
      AND order_number = '7001'
  ),
  1,
  'Un usuario de Estilos ve las Órdenes Cashea de su negocio'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000001',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7112","invoice_number":"551-0112","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'Negocio inexistente, inactivo o no autorizado',
  'Un usuario de Estilos no puede registrar Ventas Cashea en Full Calzado'
);

SELECT throws_ok(
  $$
    SELECT public.create_cashea_sale(
      '10000000-0000-0000-0000-000000000002',
      '[{"product_id":"39000000-0000-0000-0000-000000000002","quantity":1,"price_usd":30,"price_ves":2700}]'::jsonb,
      90,
      '{"order_number":"7113","invoice_number":"551-0113","total_usd":30,"paid_today_usd":10,"financed_usd":20}'::jsonb
    )
  $$,
  'P0001',
  'Producto inexistente o perteneciente a otro negocio',
  'Una Venta Cashea no puede usar Productos de otro negocio'
);

-- ─── Restricciones de la tabla ──────────────────────────────────────────────

RESET ROLE;

CREATE TEMP TABLE cashea_constraint_base ON COMMIT DROP AS
SELECT
  business_id,
  sale_id,
  sale_date,
  exchange_rate,
  service_fee_pct,
  advance_fee_pct,
  created_by
FROM public.cashea_orders
WHERE business_id = '10000000-0000-0000-0000-000000000001'
  AND sale_id = current_setting('test.cashea_sale_id')::uuid;

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
    )
    SELECT business_id, sale_id, sale_date, exchange_rate, 'CHK-1', 'F-1',
      100, 40, 59.98, service_fee_pct, advance_fee_pct, 50, created_by
    FROM cashea_constraint_base
  $$,
  '23514',
  NULL,
  'El check de suma rechaza Cobrado hoy + Monto financiado distinto del total'
);

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
    )
    SELECT business_id, sale_id, sale_date, exchange_rate, 'CHK-2', 'F-2',
      0, 0, 0, service_fee_pct, advance_fee_pct, 0, created_by
    FROM cashea_constraint_base
  $$,
  '23514',
  NULL,
  'El check de signos rechaza total y Monto financiado en cero'
);

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
    )
    SELECT business_id, sale_id, sale_date, exchange_rate, 'CHK-3', 'F-3',
      100, -10, 110, service_fee_pct, advance_fee_pct, 100, created_by
    FROM cashea_constraint_base
  $$,
  '23514',
  NULL,
  'El check de signos rechaza un Cobrado hoy negativo'
);

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by,
      status
    )
    SELECT business_id, sale_id, sale_date, exchange_rate, 'CHK-4', 'F-4',
      100, 40, 60, service_fee_pct, advance_fee_pct, 53.60, created_by,
      'collected'
    FROM cashea_constraint_base
  $$,
  '23514',
  NULL,
  'La coherencia de estado exige depósito y fecha de cobro en una orden Cobrada'
);

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by,
      status, voided_at
    )
    SELECT business_id, sale_id, sale_date, exchange_rate, 'CHK-5', 'F-5',
      100, 40, 60, service_fee_pct, advance_fee_pct, 53.60, created_by,
      'pending', now()
    FROM cashea_constraint_base
  $$,
  '23514',
  NULL,
  'La coherencia de estado exige una orden Pendiente sin datos de anulación'
);

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by,
      status, voided_at, voided_by, void_reason
    )
    SELECT business_id, sale_id, sale_date, exchange_rate, 'CHK-6', 'F-6',
      100, 40, 60, service_fee_pct, advance_fee_pct, 53.60, created_by,
      'voided', now(), created_by, 'customer_return'
    FROM cashea_constraint_base
  $$,
  '23514',
  NULL,
  'La coherencia de estado exige la nota en una orden Anulada'
);

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
    )
    SELECT '10000000-0000-0000-0000-000000000002', sale_id, sale_date, exchange_rate, 'CHK-7', 'F-7',
      100, 40, 60, service_fee_pct, advance_fee_pct, 53.60, created_by
    FROM cashea_constraint_base
  $$,
  '23503',
  NULL,
  'Una Orden Cashea no puede apuntar a una Venta de otro negocio'
);

SELECT throws_ok(
  $$
    INSERT INTO public.cashea_orders (
      business_id, sale_id, sale_date, exchange_rate, order_number, invoice_number,
      total_usd, paid_today_usd, financed_usd, service_fee_pct, advance_fee_pct, expected_net_usd, created_by
    )
    SELECT business_id, sale_id, sale_date, exchange_rate, 'CHK-8', 'F-8',
      100, 40, 60, service_fee_pct, advance_fee_pct, 53.60, created_by
    FROM public.cashea_orders
    WHERE business_id = '10000000-0000-0000-0000-000000000001'
      AND order_number = '7101'
  $$,
  '23505',
  NULL,
  'Una Venta admite como máximo una Orden Cashea no anulada'
);

SELECT * FROM finish();

ROLLBACK;
