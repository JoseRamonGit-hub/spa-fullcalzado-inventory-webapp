BEGIN;

SELECT plan(6);

SELECT set_config('app.suppress_log_entry', 'true', true);
SELECT set_config('test.today', (now() AT TIME ZONE 'America/Caracas')::date::text, true);

INSERT INTO public.businesses (id, name, slug)
VALUES
  ('3e000000-0000-0000-0000-000000000001', 'Prueba días sin cierre', 'prueba-dias-sin-cierre'),
  ('3e000000-0000-0000-0000-000000000002', 'Otro negocio días sin cierre', 'otro-negocio-dias-sin-cierre');

INSERT INTO public.user_business_access (user_id, business_id)
VALUES ('a0000000-0000-0000-0000-000000000002', '3e000000-0000-0000-0000-000000000001');

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES
  ('3e000000-0000-0000-0000-000000000011', '3e000000-0000-0000-0000-000000000001', 'UNCLOSED-01', 'Producto días sin cierre', 50, 40, true),
  ('3e000000-0000-0000-0000-000000000012', '3e000000-0000-0000-0000-000000000002', 'UNCLOSED-02', 'Producto del otro negocio', 50, 40, true);

-- Hace 5 días: ventas y cierre. Hace 4: ventas sin cierre. Hace 3: ni ventas ni
-- cierre. Hoy: ventas todavía sin cierre. El otro negocio vende hace 4 días.
INSERT INTO public.transactions (business_id, product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date)
VALUES
  ('3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000011', 1, 40, 3600, 90, 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 5),
  ('3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000011', 1, 40, 3600, 90, 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 4),
  ('3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000011', 2, 40, 3600, 90, 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date - 4),
  ('3e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000011', 1, 40, 3600, 90, 'a0000000-0000-0000-0000-000000000002', current_setting('test.today')::date),
  ('3e000000-0000-0000-0000-000000000002', '3e000000-0000-0000-0000-000000000012', 1, 40, 3600, 90, 'a0000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 4);

INSERT INTO public.cash_closes (business_id, date, total_usd, total_ves, exchange_rate, closed_by)
VALUES (
  '3e000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 5, 40, 3600, 90,
  'a0000000-0000-0000-0000-000000000002'
);

SELECT set_config('app.suppress_log_entry', 'false', true);

SELECT ok(
  NOT has_function_privilege('anon', 'public.get_unclosed_cash_close_days(uuid)', 'EXECUTE'),
  'anon no puede ejecutar get_unclosed_cash_close_days'
);

SELECT ok(
  NOT has_function_privilege('anon', 'private.get_unclosed_cash_close_days(uuid)', 'EXECUTE'),
  'anon no puede ejecutar private.get_unclosed_cash_close_days'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT results_eq(
  $$
    SELECT date, billed_operations, total_units_sold, total_usd, net_usd
    FROM public.get_unclosed_cash_close_days('3e000000-0000-0000-0000-000000000001')
  $$,
  $$ VALUES (current_setting('test.today')::date - 4, 2, 3, 120::numeric, 120::numeric) $$,
  'Solo el día con ventas y sin cierre aparece, con su resumen; ni el día cerrado, ni el día sin ventas, ni hoy'
);

SELECT throws_ok(
  $$ SELECT * FROM public.get_unclosed_cash_close_days('3e000000-0000-0000-0000-000000000002') $$,
  'P0001',
  'Negocio inexistente, inactivo o no autorizado',
  'El empleado no consulta un negocio sin acceso'
);

RESET ROLE;

INSERT INTO public.cash_closes (business_id, date, total_usd, total_ves, exchange_rate, closed_by)
VALUES (
  '3e000000-0000-0000-0000-000000000001', current_setting('test.today')::date - 4, 120, 10800, 90,
  'a0000000-0000-0000-0000-000000000002'
);

SET LOCAL ROLE authenticated;

SELECT is_empty(
  $$ SELECT * FROM public.get_unclosed_cash_close_days('3e000000-0000-0000-0000-000000000001') $$,
  'Cerrar el día lo saca de los días sin cierre'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT results_eq(
  $$ SELECT date FROM public.get_unclosed_cash_close_days('3e000000-0000-0000-0000-000000000002') $$,
  $$ VALUES (current_setting('test.today')::date - 4) $$,
  'El otro negocio solo ve sus propios días sin cierre'
);

SELECT * FROM finish();
ROLLBACK;
