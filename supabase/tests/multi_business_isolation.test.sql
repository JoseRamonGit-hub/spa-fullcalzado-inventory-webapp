-- ============================================================================
-- TEST SUITE: multi_business_isolation
-- Requires the deterministic local seed.
-- ============================================================================

BEGIN;

SELECT plan(28);
SELECT set_config('app.suppress_log_entry', 'false', true);

-- Structural and backfill guarantees.
SELECT is(
  (SELECT count(*)::int FROM public.businesses),
  2,
  'Two initial businesses exist'
);

SELECT is(
  (
    SELECT count(*)::int
    FROM (
      SELECT business_id FROM public.products
      UNION ALL SELECT business_id FROM public.inventory_movements
      UNION ALL SELECT business_id FROM public.transactions
      UNION ALL SELECT business_id FROM public.returns
      UNION ALL SELECT business_id FROM public.return_items
      UNION ALL SELECT business_id FROM public.cash_closes
      UNION ALL SELECT business_id FROM public.exchange_rates
      UNION ALL SELECT business_id FROM public.app_settings
    ) tenant_rows
    WHERE business_id IS NULL
  ),
  0,
  'No tenant row has a null business_id'
);

SELECT is(
  (SELECT count(*)::int FROM public.app_settings),
  2,
  'There is one app_settings row per business'
);

SELECT is(
  (
    SELECT count(*)::int
    FROM public.user_business_access
    WHERE user_id = 'a0000000-0000-0000-0000-000000000003'
  ),
  2,
  'A user can be assigned to multiple businesses'
);

SELECT is(
  (SELECT count(*)::int FROM public.products WHERE code = 'NK-39'),
  2,
  'The same product code can exist in both businesses'
);

UPDATE public.users
SET is_active = false
WHERE id = 'a0000000-0000-0000-0000-000000000004';

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);

SELECT is(
  (SELECT count(*)::int FROM public.businesses),
  0,
  'Inactive employee cannot read assigned businesses'
);

RESET ROLE;

UPDATE public.users
SET is_active = true
WHERE id = 'a0000000-0000-0000-0000-000000000004';

-- Carlos is assigned only to Full Calzado.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT is(
  (SELECT count(*)::int FROM public.businesses),
  1,
  'Full Calzado employee sees one business'
);

SELECT is(
  (SELECT id::text FROM public.businesses LIMIT 1),
  '10000000-0000-0000-0000-000000000001',
  'Full Calzado employee sees the assigned business'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM public.products
    WHERE business_id <> '10000000-0000-0000-0000-000000000001'
  ),
  'Full Calzado employee cannot read Estilos products'
);

SELECT ok(
  (SELECT count(*) FROM public.users) >= 4,
  'Authenticated operational users may read user profiles'
);

SELECT is(
  (SELECT count(*)::int FROM public.user_business_access),
  1,
  'Employee sees only their own access assignment'
);

SELECT throws_ok(
  $$
    INSERT INTO public.inventory_movements (
      business_id, type, product_id, quantity, user_id
    ) VALUES (
      '10000000-0000-0000-0000-000000000001',
      'entry',
      'b0000000-0000-0000-0000-000000000001',
      1,
      'a0000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  NULL,
  'WITH CHECK rejects impersonating another user'
);

SELECT lives_ok(
  $$
    INSERT INTO public.products (
      id, business_id, code, description, stock, price_usd
    ) VALUES (
      'bbbb0000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'RLS-EMP-01',
      'Employee-created product',
      2,
      20
    )
  $$,
  'Employee can create a product in the assigned business'
);

SELECT is(
  (
    SELECT user_id::text
    FROM public.inventory_movements
    WHERE product_id = 'bbbb0000-0000-0000-0000-000000000001'
      AND type = 'entry'
    LIMIT 1
  ),
  'a0000000-0000-0000-0000-000000000002',
  'Product entry movement records auth.uid as actor'
);

SELECT throws_ok(
  $$
    SELECT public.edit_product(
      '10000000-0000-0000-0000-000000000001',
      'bbbb0000-0000-0000-0000-000000000001',
      NULL,
      'Forbidden employee edit',
      NULL,
      NULL
    )
  $$,
  'P0001',
  'Solo un administrador puede editar productos',
  'Employee cannot edit a product'
);

SELECT throws_ok(
  $$
    SELECT public.admin_set_user_business_access(
      'a0000000-0000-0000-0000-000000000002',
      ARRAY['10000000-0000-0000-0000-000000000002'::uuid],
      '10000000-0000-0000-0000-000000000002'::uuid
    )
  $$,
  'P0001',
  'Solo un administrador puede gestionar accesos de usuarios',
  'Employee cannot assign business access'
);

-- Luis is assigned only to Zapatería Estilos.
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);

SELECT is(
  (SELECT id::text FROM public.businesses LIMIT 1),
  '10000000-0000-0000-0000-000000000002',
  'Estilos employee sees the assigned business'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM public.products
    WHERE business_id <> '10000000-0000-0000-0000-000000000002'
  ),
  'Estilos employee cannot read Full Calzado products'
);

SELECT lives_ok(
  $$
    SELECT public.generate_daily_cash_close(
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  'Assigned employee can generate the Estilos cash close'
);

-- Maria is an administrator and can switch between both businesses.
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT is(
  (SELECT count(*)::int FROM public.businesses),
  2,
  'Administrator sees both businesses'
);

SELECT is(
  (SELECT count(DISTINCT business_id)::int FROM public.products),
  2,
  'Administrator reads products from both businesses'
);

SELECT lives_ok(
  $$
    SELECT public.generate_daily_cash_close(
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  'Administrator can generate the Full Calzado cash close'
);

SELECT is(
  (
    SELECT count(*)::int
    FROM public.cash_closes
    WHERE date = (now() AT TIME ZONE 'America/Caracas')::date
  ),
  2,
  'Both businesses can have a cash close on the same date'
);

RESET ROLE;

SELECT is(
  (
    SELECT count(*)::int
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  ),
  0,
  'No SECURITY DEFINER function remains in the exposed public schema'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.products', 'SELECT'),
  'anon cannot read products'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.products', 'UPDATE'),
  'authenticated cannot update products directly'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.edit_product(uuid,uuid,character varying,character varying,numeric,integer)',
    'EXECUTE'
  ),
  'anon cannot execute operational RPCs'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'private.process_sale_transaction()',
    'EXECUTE'
  ),
  'authenticated cannot execute private trigger functions'
);

SELECT * FROM finish();

ROLLBACK;
