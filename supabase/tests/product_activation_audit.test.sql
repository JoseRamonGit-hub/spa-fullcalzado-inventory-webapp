-- ============================================================================
-- TEST SUITE: product_activation_audit
-- Verifies audited product status changes without mutating stock.
-- ============================================================================

BEGIN;

SELECT plan(17);
SELECT set_config('app.suppress_log_entry', 'true', true);

INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active)
VALUES
  (
    '32000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'STATUS-AUDIT-01',
    'Producto para auditoría de estado',
    7,
    30,
    true
  ),
  (
    '32000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'STATUS-AUDIT-02',
    'Producto aislado para auditoría',
    4,
    22,
    true
  );

SELECT set_config('app.suppress_log_entry', 'false', true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT lives_ok(
  $$SELECT public.set_product_active(
    '10000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    false
  )$$,
  'An administrator can deactivate a product'
);

SELECT ok(
  NOT (SELECT active FROM public.products WHERE id = '32000000-0000-0000-0000-000000000001'),
  'Deactivation changes the product state'
);

SELECT results_eq(
  $$SELECT business_id, product_id, user_id, type::text, quantity
    FROM public.inventory_movements
    WHERE product_id = '32000000-0000-0000-0000-000000000001'
    ORDER BY created_at$$,
  $$VALUES (
    '10000000-0000-0000-0000-000000000001'::uuid,
    '32000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'deactivation'::text,
    0
  )$$,
  'Deactivation records its tenant, product, actor, type, and no stock variation'
);

SELECT ok(
  (SELECT created_at IS NOT NULL
   FROM public.inventory_movements
   WHERE product_id = '32000000-0000-0000-0000-000000000001'
     AND type = 'deactivation'),
  'Deactivation records its timestamp'
);

SELECT ok(
  (SELECT date = (now() at time zone 'America/Caracas')::date
      AND time = (now() at time zone 'America/Caracas')::time
   FROM public.inventory_movements
   WHERE product_id = '32000000-0000-0000-0000-000000000001'
     AND type = 'deactivation'),
  'Deactivation records the Caracas date and time'
);

SELECT is(
  (SELECT stock FROM public.products WHERE id = '32000000-0000-0000-0000-000000000001'),
  7,
  'Deactivation does not modify stock'
);

SELECT lives_ok(
  $$SELECT public.set_product_active(
    '10000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    true
  )$$,
  'An administrator can reactivate a product'
);

SELECT results_eq(
  $$SELECT type::text, quantity
    FROM public.inventory_movements
    WHERE product_id = '32000000-0000-0000-0000-000000000001'
    ORDER BY CASE type
      WHEN 'deactivation' THEN 1
      WHEN 'activation' THEN 2
    END$$,
  $$VALUES ('deactivation'::text, 0), ('activation'::text, 0)$$,
  'Reactivation records an activation event without a stock variation'
);

SELECT lives_ok(
  $$SELECT public.set_product_active(
    '10000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    true
  )$$,
  'A repeated status request is harmless'
);

SELECT is(
  (SELECT count(*)::integer FROM public.inventory_movements
   WHERE product_id = '32000000-0000-0000-0000-000000000001'),
  2,
  'A repeated status request does not invent an event'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT throws_ok(
  $$SELECT public.set_product_active(
    '10000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    false
  )$$,
  'P0001',
  'Solo un administrador puede activar o desactivar productos',
  'A non-administrator cannot change product status'
);

SELECT ok(
  (SELECT active FROM public.products WHERE id = '32000000-0000-0000-0000-000000000001'),
  'Unauthorized status changes leave the product unchanged'
);

SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT throws_ok(
  $$SELECT public.set_product_active(
    '10000000-0000-0000-0000-000000000002',
    '32000000-0000-0000-0000-000000000001',
    false
  )$$,
  'P0001',
  'Producto no encontrado',
  'A product cannot be changed through another business'
);

SELECT is(
  (SELECT count(*)::integer FROM public.inventory_movements
   WHERE business_id = '10000000-0000-0000-0000-000000000002'
     AND product_id = '32000000-0000-0000-0000-000000000001'),
  0,
  'Cross-business calls cannot create an audited event'
);

RESET ROLE;

CREATE FUNCTION private.fail_status_audit_test()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.product_id = '32000000-0000-0000-0000-000000000001'::uuid THEN
    RAISE EXCEPTION 'forced audit failure';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER fail_status_audit_test
BEFORE INSERT ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION private.fail_status_audit_test();

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT throws_ok(
  $$SELECT public.set_product_active(
    '10000000-0000-0000-0000-000000000001',
    '32000000-0000-0000-0000-000000000001',
    false
  )$$,
  'P0001',
  'forced audit failure',
  'A failed audit event rejects the state change'
);

SELECT ok(
  (SELECT active FROM public.products WHERE id = '32000000-0000-0000-0000-000000000001'),
  'Audit failure rolls back the product state change'
);

SELECT is(
  (SELECT count(*)::integer FROM public.inventory_movements
   WHERE product_id = '32000000-0000-0000-0000-000000000001'),
  2,
  'Audit failure leaves no partial event'
);

SELECT * FROM finish();
ROLLBACK;
