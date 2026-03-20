-- ============================================================================
-- TEST SUITE: edit_product_and_historical_tracking
--
-- Validates:
--   TEST 1 — edit_product() RPC creates exactly one 'edit' movement
--            (no duplicate 'entry' from suppressed trigger)
--   TEST 2 — edit_product() correctly records stock_before, price_usd,
--            price_usd_before, and description_before
--   TEST 3 — edit_product() allows quantity=0 when only price/desc change
--   TEST 4 — quantity CHECK still enforced for non-edit types (quantity > 0)
--   TEST 5 — Entry movements now populate stock_before and price_usd
--   TEST 6 — New product creation populates stock_before=0 and price_usd
--
-- FRAMEWORK: pgTAP 1.3 (https://pgtap.org)
-- EJECUTAR:  npx supabase test db
-- ============================================================================

BEGIN;

SELECT plan(16);

-- ============================================================================
-- SETUP
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    INSERT INTO auth.users (id, email, instance_id, aud, role, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_confirmed_at)
    VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      'test@test.com',
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated', 'authenticated', crypt('password', gen_salt('bf')),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"fullname":"Test User"}'::jsonb,
      now(), now(), '', now()
    );
  END IF;
END;
$$;

-- Create test products with stock=0 so the trigger fires but creates NO movements
-- (log_product_entry only inserts when v_quantity > 0).
-- Then use direct UPDATE with suppression to set desired stock without side effects.

INSERT INTO public.products (id, code, description, stock, price_usd, active)
VALUES (
  'aaaa0000-0000-0000-0000-000000000001'::uuid,
  'TEST-EDIT-001',
  'Zapato original',
  0,
  25.00,
  true
);

INSERT INTO public.products (id, code, description, stock, price_usd, active)
VALUES (
  'aaaa0000-0000-0000-0000-000000000002'::uuid,
  'TEST-EDIT-002',
  'Bota de cuero',
  0,
  40.00,
  true
);

INSERT INTO public.products (id, code, description, stock, price_usd, active)
VALUES (
  'aaaa0000-0000-0000-0000-000000000003'::uuid,
  'TEST-ENTRY-001',
  'Sandalia test',
  0,
  15.00,
  true
);

-- Set desired stock for test products via suppressed UPDATE (no movements created)
DO $$
BEGIN
  PERFORM set_config('app.suppress_log_entry', 'true', true);
  UPDATE public.products SET stock = 10 WHERE id = 'aaaa0000-0000-0000-0000-000000000001';
  UPDATE public.products SET stock = 5  WHERE id = 'aaaa0000-0000-0000-0000-000000000003';
  PERFORM set_config('app.suppress_log_entry', 'false', true);
END;
$$;

-- ============================================================================
-- TEST 1: edit_product creates exactly ONE 'edit' movement (no duplicates)
-- ============================================================================

-- 1a. Count movements before edit
SELECT is(
  (SELECT count(*)::int FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'),
  0,
  'TEST 1a: No movements before edit_product call'
);

-- 1b. Call edit_product (change stock from 10 to 15)
SELECT public.edit_product(
  p_product_id := 'aaaa0000-0000-0000-0000-000000000001'::uuid,
  p_stock      := 15,
  p_user_id    := (SELECT id FROM public.users LIMIT 1)
);

-- 1c. Exactly 1 movement created (not 2 — trigger suppressed)
SELECT is(
  (SELECT count(*)::int FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'),
  1,
  'TEST 1b: Exactly 1 movement created (trigger suppression works)'
);

-- 1d. The movement is type 'edit', not 'entry'
SELECT is(
  (SELECT type::text FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'
   LIMIT 1),
  'edit',
  'TEST 1c: Movement type is edit (not entry from trigger)'
);

-- 1e. Product stock updated correctly
SELECT is(
  (SELECT stock FROM public.products
   WHERE id = 'aaaa0000-0000-0000-0000-000000000001'),
  15,
  'TEST 1d: Product stock updated to 15'
);

-- ============================================================================
-- TEST 2: edit_product records all before/after data correctly
-- ============================================================================

-- 2a. Call edit_product changing description, price, and stock
SELECT public.edit_product(
  p_product_id  := 'aaaa0000-0000-0000-0000-000000000001'::uuid,
  p_description := 'Zapato editado',
  p_price_usd   := 30.00,
  p_stock       := 20,
  p_user_id     := (SELECT id FROM public.users LIMIT 1)
);

-- Target the second edit movement deterministically via description_before IS NOT NULL
-- (first edit only changed stock, second edit changed description+price+stock)

-- 2b. Verify stock_before
SELECT is(
  (SELECT stock_before FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'
     AND description_before IS NOT NULL
   LIMIT 1),
  15,
  'TEST 2a: stock_before is 15 (stock before this edit)'
);

-- 2c. Verify quantity (signed diff: 20 - 15 = 5)
SELECT is(
  (SELECT quantity FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'
     AND description_before IS NOT NULL
   LIMIT 1),
  5,
  'TEST 2b: quantity is 5 (signed diff: 20 - 15)'
);

-- 2d. Verify price_usd (new price)
SELECT is(
  (SELECT price_usd FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'
     AND description_before IS NOT NULL
   LIMIT 1),
  30.00,
  'TEST 2c: price_usd is 30.00 (new price)'
);

-- 2e. Verify price_usd_before (old price)
SELECT is(
  (SELECT price_usd_before FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'
     AND description_before IS NOT NULL
   LIMIT 1),
  25.00,
  'TEST 2d: price_usd_before is 25.00 (old price)'
);

-- 2f. Verify description_before (old description)
SELECT is(
  (SELECT description_before FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000001'
     AND description_before IS NOT NULL
   LIMIT 1),
  'Zapato original',
  'TEST 2e: description_before is the old description'
);

-- ============================================================================
-- TEST 3: edit_product allows quantity=0 (price/description-only change)
-- ============================================================================

-- 3a. Edit only price (no stock change)
SELECT public.edit_product(
  p_product_id := 'aaaa0000-0000-0000-0000-000000000002'::uuid,
  p_price_usd  := 45.00,
  p_user_id    := (SELECT id FROM public.users LIMIT 1)
);

-- 3b. Movement created with quantity=0
SELECT is(
  (SELECT quantity FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000002'
   ORDER BY created_at DESC LIMIT 1),
  0,
  'TEST 3a: quantity=0 for price-only edit (no stock change)'
);

-- 3c. description_before is NULL (description didn't change)
SELECT ok(
  (SELECT description_before IS NULL FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000002'
   ORDER BY created_at DESC LIMIT 1),
  'TEST 3b: description_before is NULL (description unchanged)'
);

-- ============================================================================
-- TEST 4: quantity CHECK still enforced for non-edit types
-- ============================================================================

SELECT throws_ok(
  $$INSERT INTO public.inventory_movements (type, product_id, quantity, user_id, date, time)
    VALUES ('entry', 'aaaa0000-0000-0000-0000-000000000003', 0,
            (SELECT id FROM public.users LIMIT 1), current_date, current_time)$$,
  '23514',
  NULL,
  'TEST 4: quantity=0 rejected for entry type (CHECK constraint enforced)'
);

-- ============================================================================
-- TEST 5: Entry movements populate stock_before and price_usd
-- ============================================================================

-- 5a. Insert entry movement for product with stock=5, price=15.00
INSERT INTO public.inventory_movements (type, product_id, quantity, user_id, date, time,
  stock_before, price_usd)
VALUES (
  'entry',
  'aaaa0000-0000-0000-0000-000000000003',
  3,
  (SELECT id FROM public.users LIMIT 1),
  current_date,
  current_time,
  5,
  15.00
);

-- 5b. Verify stock_before was stored
SELECT is(
  (SELECT stock_before FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000003'
     AND type = 'entry'
   ORDER BY created_at DESC LIMIT 1),
  5,
  'TEST 5a: Entry movement has stock_before=5'
);

-- 5c. Verify price_usd was stored
SELECT is(
  (SELECT price_usd FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000003'
     AND type = 'entry'
   ORDER BY created_at DESC LIMIT 1),
  15.00,
  'TEST 5b: Entry movement has price_usd=15.00'
);

-- ============================================================================
-- TEST 6: New product creation via trigger populates stock_before=0, price_usd
-- ============================================================================

-- Reset suppress flag left over from edit_product() calls in earlier tests
-- (set_config with is_local=true persists for the entire transaction)
SELECT set_config('app.suppress_log_entry', 'false', true);

INSERT INTO public.products (id, code, description, stock, price_usd, active)
VALUES (
  'aaaa0000-0000-0000-0000-000000000004'::uuid,
  'TEST-NEW-001',
  'Producto nuevo con trigger',
  8,
  22.50,
  true
);

-- 6a. Trigger created entry movement with stock_before=0
SELECT is(
  (SELECT stock_before FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000004'
     AND type = 'entry'
   LIMIT 1),
  0,
  'TEST 6a: New product entry has stock_before=0'
);

-- 6b. Trigger created entry movement with correct price_usd
SELECT is(
  (SELECT price_usd FROM public.inventory_movements
   WHERE product_id = 'aaaa0000-0000-0000-0000-000000000004'
     AND type = 'entry'
   LIMIT 1),
  22.50,
  'TEST 6b: New product entry has price_usd=22.50'
);

-- ============================================================================
-- TEARDOWN
-- ============================================================================
SELECT * FROM finish();

ROLLBACK;
