-- ============================================================================
-- Migration 2/2: edit_product_rpc_and_trigger_updates
--
-- Requires the 'edit' enum value from the previous migration to be committed.
--
-- PURPOSE:
--   1. Relax quantity CHECK to allow quantity=0 for edit movements
--   2. Update ALL trigger functions to populate stock_before and price_usd
--   3. Create edit_product() RPC for atomic product editing with movement logging
--
-- TRIGGER SUPPRESSION:
--   edit_product() uses SET LOCAL 'app.suppress_log_entry' to prevent
--   log_product_entry() from creating a duplicate 'entry' movement when
--   the RPC updates product stock. The session var is transaction-local
--   and auto-resets on commit/rollback.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Relax quantity CHECK — allow quantity >= 0 for edit type only
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.inventory_movements
  DROP CONSTRAINT inventory_movements_quantity_check;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_quantity_check
  CHECK (quantity > 0 OR type = 'edit');

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Update log_product_entry() — populate new columns + session var guard
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_product_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id  uuid;
  v_quantity int;
BEGIN
  -- Suppress when edit_product() RPC is handling its own movement
  IF current_setting('app.suppress_log_entry', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Anti-recursion guard (sync_stock_on_entry_movement → products UPDATE)
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.users LIMIT 1;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_quantity := NEW.stock;
  ELSIF TG_OP = 'UPDATE' THEN
    v_quantity := NEW.stock - OLD.stock;
  END IF;

  IF v_quantity > 0 THEN
    INSERT INTO public.inventory_movements (
      type, product_id, quantity, user_id, date, time, created_at,
      stock_before, price_usd
    ) VALUES (
      'entry',
      NEW.id,
      v_quantity,
      v_user_id,
      current_date,
      current_time,
      now(),
      CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.stock END,
      NEW.price_usd
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Update process_sale_transaction() — populate stock_before, price_usd
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_sale_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock int;
  v_current_price numeric(12,2);
BEGIN
  -- Read current product state BEFORE modifying
  SELECT stock, price_usd INTO v_current_stock, v_current_price
  FROM public.products WHERE id = NEW.product_id;

  -- Step A: Decrease product stock
  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Step B: Create exit movement with historical data
  INSERT INTO public.inventory_movements (
    type, product_id, quantity, user_id, date, time, created_at, return_id,
    stock_before, price_usd
  ) VALUES (
    'exit',
    NEW.product_id,
    NEW.quantity,
    NEW.user_id,
    NEW.date,
    NEW.time,
    NEW.created_at,
    NEW.return_id,
    v_current_stock,
    v_current_price
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.process_sale_transaction() OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Update process_return_item() — populate stock_before, price_usd
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_return_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id  uuid;
  v_date     date;
  v_time     time;
  v_current_stock int;
  v_current_price numeric(12,2);
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  SELECT user_id, date, time
  INTO v_user_id, v_date, v_time
  FROM public.returns WHERE id = NEW.return_id;

  -- Read current product state BEFORE modifying
  SELECT stock, price_usd INTO v_current_stock, v_current_price
  FROM public.products WHERE id = NEW.product_id;

  UPDATE public.products
  SET stock = stock + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  INSERT INTO public.inventory_movements (
    type, product_id, quantity, user_id, date, time, created_at, return_id,
    stock_before, price_usd
  ) VALUES (
    'return',
    NEW.product_id,
    NEW.quantity,
    v_user_id,
    v_date,
    v_time,
    now(),
    NEW.return_id,
    v_current_stock,
    v_current_price
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.process_return_item() OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Create edit_product() RPC
--
-- Atomic product edit that:
--   1. Reads current state (before values)
--   2. Suppresses log_product_entry trigger via session var
--   3. Updates the product
--   4. Creates a single 'edit' movement with full before/after data
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.edit_product(
  p_product_id  uuid,
  p_code        varchar DEFAULT NULL,
  p_description varchar DEFAULT NULL,
  p_price_usd   numeric DEFAULT NULL,
  p_stock       integer DEFAULT NULL,
  p_user_id     uuid    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id          uuid;
  v_old              record;
  v_stock_diff       int;
  v_date             date;
  v_time             time;
BEGIN
  -- Resolve user
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.users LIMIT 1;
  END IF;

  -- Read current product state
  SELECT * INTO v_old FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- Venezuela timezone
  v_date := (now() AT TIME ZONE 'America/Caracas')::date;
  v_time := (now() AT TIME ZONE 'America/Caracas')::time;

  -- Calculate stock difference (0 if stock not changing)
  v_stock_diff := COALESCE(p_stock, v_old.stock) - v_old.stock;

  -- Suppress log_product_entry trigger to avoid duplicate movement
  -- The 'true' flag makes it transaction-local → auto-resets on commit/rollback
  PERFORM set_config('app.suppress_log_entry', 'true', true);

  -- Update product
  UPDATE public.products SET
    code        = COALESCE(p_code, v_old.code),
    description = COALESCE(p_description, v_old.description),
    price_usd   = COALESCE(p_price_usd, v_old.price_usd),
    stock       = COALESCE(p_stock, v_old.stock),
    updated_at  = now()
  WHERE id = p_product_id;

  -- Create the edit movement
  INSERT INTO public.inventory_movements (
    type, product_id, quantity, user_id, date, time, created_at,
    stock_before, price_usd, price_usd_before, description_before
  ) VALUES (
    'edit',
    p_product_id,
    v_stock_diff,
    v_user_id,
    v_date,
    v_time,
    now(),
    v_old.stock,
    COALESCE(p_price_usd, v_old.price_usd),
    CASE WHEN p_price_usd IS NOT NULL AND p_price_usd <> v_old.price_usd
         THEN v_old.price_usd ELSE NULL END,
    CASE WHEN p_description IS NOT NULL AND p_description <> v_old.description
         THEN v_old.description ELSE NULL END
  );

  -- Return updated product
  RETURN jsonb_build_object(
    'id', p_product_id,
    'stock_before', v_old.stock,
    'stock_after', COALESCE(p_stock, v_old.stock),
    'price_usd_before', v_old.price_usd,
    'price_usd_after', COALESCE(p_price_usd, v_old.price_usd)
  );
END;
$$;

ALTER FUNCTION public.edit_product(uuid, varchar, varchar, numeric, integer, uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.edit_product(uuid, varchar, varchar, numeric, integer, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.edit_product(uuid, varchar, varchar, numeric, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.edit_product(uuid, varchar, varchar, numeric, integer, uuid) TO service_role;
