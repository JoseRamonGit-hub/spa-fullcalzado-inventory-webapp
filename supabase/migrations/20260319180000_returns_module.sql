-- ============================================================================
-- Migration: returns_module
--
-- Implements the complete Returns/Exchanges module:
--   1. New enum: return_types ('exchange', 'refund')
--   2. Extend enum: movement_types + 'return'
--   3. New table: returns (header)
--   4. New table: return_items (detail — products returned by customer)
--   5. Alter table: transactions + return_id FK (nullable)
--   6. Alter table: cash_closes + returns columns
--   7. New trigger: process_return_item (stock += qty, insert movement)
--   8. New RPC: process_return (atomic transaction for the full operation)
--   9. Modified function: generate_daily_cash_close (subtract return credits)
--  10. RLS policies for new tables
--  11. Indexes for performance
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. New enum: return_types
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE public.return_types AS ENUM ('exchange', 'refund');
ALTER TYPE public.return_types OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Extend movement_types with 'return'
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TYPE public.movement_types ADD VALUE 'return';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. New table: returns
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.returns (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  type            public.return_types NOT NULL,
  credit_usd      numeric(12,2) NOT NULL CHECK (credit_usd >= 0),
  credit_ves      numeric(12,2) NOT NULL CHECK (credit_ves >= 0),
  difference_usd  numeric(12,2) NOT NULL DEFAULT 0,
  difference_ves  numeric(12,2) NOT NULL DEFAULT 0,
  exchange_rate   numeric(12,4) NOT NULL CHECK (exchange_rate > 0),
  user_id         uuid          NOT NULL REFERENCES public.users(id),
  date            date          NOT NULL DEFAULT (now() AT TIME ZONE 'America/Caracas')::date,
  time            time          NOT NULL DEFAULT (now() AT TIME ZONE 'America/Caracas')::time,
  created_at      timestamptz   DEFAULT now(),
  notes           text
);

ALTER TABLE public.returns OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. New table: return_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.return_items (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id   uuid          NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  product_id  uuid          NOT NULL REFERENCES public.products(id),
  quantity    integer       NOT NULL CHECK (quantity > 0),
  price_usd   numeric(12,2) NOT NULL CHECK (price_usd > 0),
  price_ves   numeric(12,2) NOT NULL CHECK (price_ves > 0)
);

ALTER TABLE public.return_items OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Alter transactions: add return_id FK (nullable)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.transactions
  ADD COLUMN return_id uuid REFERENCES public.returns(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Alter cash_closes: add returns columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cash_closes
  ADD COLUMN total_returns      integer       NOT NULL DEFAULT 0,
  ADD COLUMN total_returns_usd  numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN total_returns_ves  numeric(12,2) NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Trigger function: process_return_item
--    On INSERT into return_items:
--      a) Increase product stock
--      b) Create inventory_movement of type 'return'
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

  -- Step B: Create inventory movement of type 'return'
  INSERT INTO public.inventory_movements (
    type,
    product_id,
    quantity,
    user_id,
    date,
    time,
    created_at
  ) VALUES (
    'return',
    NEW.product_id,
    NEW.quantity,
    v_user_id,
    v_date,
    v_time,
    now()
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.process_return_item() OWNER TO postgres;

CREATE TRIGGER on_return_item_created
  AFTER INSERT ON public.return_items
  FOR EACH ROW
  EXECUTE FUNCTION public.process_return_item();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Patch sync_stock_on_entry_movement to also ignore 'return' movements
--    (process_return_item already handles stock, so we skip the entry sync)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_stock_on_entry_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process entry movements (not 'exit' or 'return')
  IF NEW.type <> 'entry' THEN
    RETURN NEW;
  END IF;

  -- Anti-recursion guard
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  UPDATE public.products
  SET stock      = stock + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.sync_stock_on_entry_movement() OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. RPC: process_return
--    Atomic function that handles the full return/exchange operation.
--    Receives the complete payload and executes everything in a single tx.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_return(
  p_type          text,
  p_returned_items jsonb,
  p_new_items     jsonb DEFAULT NULL,
  p_exchange_rate numeric DEFAULT NULL,
  p_user_id       uuid DEFAULT NULL,
  p_notes         text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id       uuid;
  v_user_role     public.roles;
  v_return_id     uuid;
  v_credit_usd    numeric(12,2) := 0;
  v_credit_ves    numeric(12,2) := 0;
  v_new_total_usd numeric(12,2) := 0;
  v_new_total_ves numeric(12,2) := 0;
  v_diff_usd      numeric(12,2) := 0;
  v_diff_ves      numeric(12,2) := 0;
  v_return_type   public.return_types;
  v_item          jsonb;
  v_date          date;
  v_time          time;
BEGIN
  -- Resolve user
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get user role for permission checks
  SELECT role INTO v_user_role FROM public.users WHERE id = v_user_id;

  -- Validate exchange rate
  IF p_exchange_rate IS NULL OR p_exchange_rate <= 0 THEN
    RAISE EXCEPTION 'La tasa de cambio es requerida y debe ser mayor a 0';
  END IF;

  -- Parse return type
  v_return_type := p_type::public.return_types;

  -- Set Venezuela timezone date/time
  v_date := (now() AT TIME ZONE 'America/Caracas')::date;
  v_time := (now() AT TIME ZONE 'America/Caracas')::time;

  -- ── Calculate credit (sum of returned items) ─────────────────
  SELECT
    COALESCE(SUM((item->>'price_usd')::numeric * (item->>'quantity')::int), 0),
    COALESCE(SUM((item->>'price_ves')::numeric * (item->>'quantity')::int), 0)
  INTO v_credit_usd, v_credit_ves
  FROM jsonb_array_elements(p_returned_items) AS item;

  -- ── Calculate new sale total (if exchange) ───────────────────
  IF p_new_items IS NOT NULL AND jsonb_array_length(p_new_items) > 0 THEN
    SELECT
      COALESCE(SUM((item->>'price_usd')::numeric * (item->>'quantity')::int), 0),
      COALESCE(SUM((item->>'price_ves')::numeric * (item->>'quantity')::int), 0)
    INTO v_new_total_usd, v_new_total_ves
    FROM jsonb_array_elements(p_new_items) AS item;
  END IF;

  -- ── Calculate difference ─────────────────────────────────────
  v_diff_usd := v_new_total_usd - v_credit_usd;
  v_diff_ves := v_new_total_ves - v_credit_ves;

  -- ── Permission check: employees cannot process refunds or negative differences
  IF v_user_role = 'employee' THEN
    IF v_return_type = 'refund' THEN
      RAISE EXCEPTION 'Solo un administrador puede procesar devoluciones';
    END IF;
    IF v_diff_usd < 0 THEN
      RAISE EXCEPTION 'Solo un administrador puede procesar cambios con saldo a favor';
    END IF;
  END IF;

  -- ── 1. Insert return header ──────────────────────────────────
  INSERT INTO public.returns (
    type, credit_usd, credit_ves, difference_usd, difference_ves,
    exchange_rate, user_id, date, time, notes
  ) VALUES (
    v_return_type, v_credit_usd, v_credit_ves, v_diff_usd, v_diff_ves,
    p_exchange_rate, v_user_id, v_date, v_time, p_notes
  )
  RETURNING id INTO v_return_id;

  -- ── 2. Insert return_items (triggers handle stock + movements) ─
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_returned_items) LOOP
    INSERT INTO public.return_items (
      return_id, product_id, quantity, price_usd, price_ves
    ) VALUES (
      v_return_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price_usd')::numeric,
      (v_item->>'price_ves')::numeric
    );
  END LOOP;

  -- ── 3. If exchange: insert transactions for new products ─────
  --    (existing trigger process_sale_transaction handles stock - and exit movements)
  IF p_new_items IS NOT NULL AND jsonb_array_length(p_new_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items) LOOP
      INSERT INTO public.transactions (
        product_id, quantity, price_usd, price_ves,
        exchange_rate, user_id, date, time, return_id
      ) VALUES (
        (v_item->>'product_id')::uuid,
        (v_item->>'quantity')::int,
        (v_item->>'price_usd')::numeric,
        (v_item->>'price_ves')::numeric,
        p_exchange_rate,
        v_user_id,
        v_date,
        v_time,
        v_return_id
      );
    END LOOP;
  END IF;

  -- ── 4. Return the result ─────────────────────────────────────
  RETURN jsonb_build_object(
    'id', v_return_id,
    'type', v_return_type,
    'credit_usd', v_credit_usd,
    'credit_ves', v_credit_ves,
    'difference_usd', v_diff_usd,
    'difference_ves', v_diff_ves,
    'exchange_rate', p_exchange_rate,
    'date', v_date,
    'time', v_time
  );
END;
$$;

ALTER FUNCTION public.process_return(text, jsonb, jsonb, numeric, uuid, text) OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Update generate_daily_cash_close to account for returns
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_daily_cash_close(p_user_id uuid)
RETURNS public.cash_closes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_date        date;
  v_total_transactions int;
  v_total_units        int;
  v_total_usd          numeric(12,2);
  v_total_ves          numeric(12,2);
  v_exchange_rate      numeric(12,4);
  v_returns_count      int;
  v_returns_usd        numeric(12,2);
  v_returns_ves        numeric(12,2);
  v_result             public.cash_closes;
BEGIN
  v_target_date := (now() AT TIME ZONE 'America/Caracas')::date;

  -- Sum transactions of the day
  SELECT
    COUNT(id),
    COALESCE(SUM(quantity),  0),
    COALESCE(SUM(total_usd), 0),
    COALESCE(SUM(total_ves), 0)
  INTO
    v_total_transactions,
    v_total_units,
    v_total_usd,
    v_total_ves
  FROM public.transactions
  WHERE date = v_target_date;

  -- Sum return credits of the day
  SELECT
    COUNT(id),
    COALESCE(SUM(credit_usd), 0),
    COALESCE(SUM(credit_ves), 0)
  INTO
    v_returns_count,
    v_returns_usd,
    v_returns_ves
  FROM public.returns
  WHERE date = v_target_date;

  -- Get current exchange rate
  SELECT rate INTO v_exchange_rate
  FROM public.exchange_rates
  ORDER BY updated_at DESC LIMIT 1;

  IF v_exchange_rate IS NULL THEN
    v_exchange_rate := 0;
  END IF;

  -- Upsert cash close (subtract return credits from totals)
  INSERT INTO public.cash_closes (
    date,
    total_transactions,
    total_units_sold,
    total_usd,
    total_ves,
    exchange_rate,
    closed_by,
    closed_at,
    total_returns,
    total_returns_usd,
    total_returns_ves
  ) VALUES (
    v_target_date,
    v_total_transactions,
    v_total_units,
    v_total_usd - v_returns_usd,
    v_total_ves - v_returns_ves,
    v_exchange_rate,
    p_user_id,
    now(),
    v_returns_count,
    v_returns_usd,
    v_returns_ves
  )
  ON CONFLICT (date) DO UPDATE SET
    total_transactions = EXCLUDED.total_transactions,
    total_units_sold   = EXCLUDED.total_units_sold,
    total_usd          = EXCLUDED.total_usd,
    total_ves          = EXCLUDED.total_ves,
    exchange_rate      = EXCLUDED.exchange_rate,
    closed_by          = EXCLUDED.closed_by,
    closed_at          = EXCLUDED.closed_at,
    total_returns      = EXCLUDED.total_returns,
    total_returns_usd  = EXCLUDED.total_returns_usd,
    total_returns_ves  = EXCLUDED.total_returns_ves
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

ALTER FUNCTION public.generate_daily_cash_close(uuid) OWNER TO postgres;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- returns: all authenticated can SELECT
CREATE POLICY "Authenticated users can view returns"
  ON public.returns FOR SELECT TO authenticated USING (true);

-- returns: role-based INSERT — employees can only create exchanges with non-negative difference
CREATE POLICY "Authenticated users can create returns"
  ON public.returns FOR INSERT TO authenticated
  WITH CHECK (
    (type = 'exchange' AND difference_usd >= 0)
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- return_items: all authenticated can SELECT and INSERT
CREATE POLICY "Authenticated users can view return_items"
  ON public.return_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert return_items"
  ON public.return_items FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_returns_date ON public.returns USING btree (date DESC);
CREATE INDEX idx_returns_user ON public.returns USING btree (user_id);
CREATE INDEX idx_return_items_return ON public.return_items USING btree (return_id);
CREATE INDEX idx_transactions_return ON public.transactions USING btree (return_id) WHERE return_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. Grants (same pattern as existing tables/functions)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT ALL ON TABLE public.returns TO anon;
GRANT ALL ON TABLE public.returns TO authenticated;
GRANT ALL ON TABLE public.returns TO service_role;

GRANT ALL ON TABLE public.return_items TO anon;
GRANT ALL ON TABLE public.return_items TO authenticated;
GRANT ALL ON TABLE public.return_items TO service_role;

GRANT ALL ON FUNCTION public.process_return(text, jsonb, jsonb, numeric, uuid, text) TO anon;
GRANT ALL ON FUNCTION public.process_return(text, jsonb, jsonb, numeric, uuid, text) TO authenticated;
GRANT ALL ON FUNCTION public.process_return(text, jsonb, jsonb, numeric, uuid, text) TO service_role;

GRANT ALL ON FUNCTION public.process_return_item() TO anon;
GRANT ALL ON FUNCTION public.process_return_item() TO authenticated;
GRANT ALL ON FUNCTION public.process_return_item() TO service_role;
