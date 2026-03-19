-- ============================================================================
-- Migration: add_return_id_to_movements
--
-- Links inventory_movements to returns for traceability:
--   1. Add return_id FK column to inventory_movements
--   2. Update process_return_item() to include return_id
--   3. Update process_sale_transaction() to propagate return_id from transactions
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add return_id column to inventory_movements
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.inventory_movements
  ADD COLUMN return_id uuid REFERENCES public.returns(id);

CREATE INDEX idx_inventory_movements_return
  ON public.inventory_movements(return_id)
  WHERE return_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Update process_return_item() to include return_id in the movement
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
BEGIN
  -- Anti-recursion guard
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Get return header info
  SELECT user_id, date, time
  INTO v_user_id, v_date, v_time
  FROM public.returns
  WHERE id = NEW.return_id;

  -- Step A: Increase product stock
  UPDATE public.products
  SET stock      = stock + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Step B: Create inventory movement of type 'return' with return_id
  INSERT INTO public.inventory_movements (
    type,
    product_id,
    quantity,
    user_id,
    date,
    time,
    created_at,
    return_id
  ) VALUES (
    'return',
    NEW.product_id,
    NEW.quantity,
    v_user_id,
    v_date,
    v_time,
    now(),
    NEW.return_id
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.process_return_item() OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Update process_sale_transaction() to propagate return_id
--    When a transaction has return_id (exchange), the exit movement gets it too
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_sale_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step A: Decrease product stock
  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Step B: Create inventory movement (with return_id if exchange transaction)
  INSERT INTO public.inventory_movements (
    type,
    product_id,
    quantity,
    user_id,
    date,
    time,
    created_at,
    return_id
  ) VALUES (
    'exit',
    NEW.product_id,
    NEW.quantity,
    NEW.user_id,
    NEW.date,
    NEW.time,
    NEW.created_at,
    NEW.return_id
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.process_sale_transaction() OWNER TO postgres;
