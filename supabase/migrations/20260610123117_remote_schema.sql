


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."exchange_modes" AS ENUM (
    'manual',
    'bcv'
);


ALTER TYPE "public"."exchange_modes" OWNER TO "postgres";


CREATE TYPE "public"."movement_types" AS ENUM (
    'entry',
    'exit',
    'return',
    'edit'
);


ALTER TYPE "public"."movement_types" OWNER TO "postgres";


CREATE TYPE "public"."return_types" AS ENUM (
    'exchange',
    'refund'
);


ALTER TYPE "public"."return_types" OWNER TO "postgres";


CREATE TYPE "public"."roles" AS ENUM (
    'admin',
    'employee'
);


ALTER TYPE "public"."roles" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."edit_product"("p_product_id" "uuid", "p_code" character varying DEFAULT NULL::character varying, "p_description" character varying DEFAULT NULL::character varying, "p_price_usd" numeric DEFAULT NULL::numeric, "p_stock" integer DEFAULT NULL::integer, "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."edit_product"("p_product_id" "uuid", "p_code" character varying, "p_description" character varying, "p_price_usd" numeric, "p_stock" integer, "p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cash_closes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" DEFAULT (("now"() AT TIME ZONE 'America/Caracas'::"text"))::"date" NOT NULL,
    "total_transactions" integer DEFAULT 0 NOT NULL,
    "total_units_sold" integer DEFAULT 0 NOT NULL,
    "total_usd" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_ves" numeric(12,2) DEFAULT 0 NOT NULL,
    "exchange_rate" numeric(12,4) NOT NULL,
    "closed_by" "uuid" NOT NULL,
    "closed_at" timestamp with time zone DEFAULT "now"(),
    "total_returns" integer DEFAULT 0 NOT NULL,
    "total_returns_usd" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_returns_ves" numeric(12,2) DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."cash_closes" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_daily_cash_close"("p_user_id" "uuid") RETURNS "public"."cash_closes"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."generate_daily_cash_close"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO public.users (id, email, fullname, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'fullname',
      'employee' || nextval('public.new_user_fallback_seq')
    ),
    'employee'
  );
  RETURN new;
END;$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_product_entry"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."log_product_entry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_movement_on_inactive_product"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_active boolean;
BEGIN
  SELECT active INTO v_active
  FROM public.products
  WHERE id = NEW.product_id;

  IF v_active IS NULL THEN
    RAISE EXCEPTION 'Product % not found', NEW.product_id;
  END IF;

  IF NOT v_active AND NEW.type = 'entry' THEN
    RAISE EXCEPTION 'Cannot create entry movement for inactive product %', NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_movement_on_inactive_product"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_return"("p_type" "text", "p_returned_items" "jsonb", "p_new_items" "jsonb" DEFAULT NULL::"jsonb", "p_exchange_rate" numeric DEFAULT NULL::numeric, "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."process_return"("p_type" "text", "p_returned_items" "jsonb", "p_new_items" "jsonb", "p_exchange_rate" numeric, "p_user_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_return_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."process_return_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_sale_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."process_sale_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_stock_on_entry_movement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."sync_stock_on_entry_movement"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "exchange_rate_mode" "public"."exchange_modes" DEFAULT 'manual'::"public"."exchange_modes",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "app_settings_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rate" numeric(12,4) NOT NULL,
    "source" "public"."exchange_modes" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exchange_rates_rate_check" CHECK (("rate" >= (0)::numeric))
);


ALTER TABLE "public"."exchange_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."movement_types" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT (("now"() AT TIME ZONE 'America/Caracas'::"text"))::"date" NOT NULL,
    "time" time without time zone DEFAULT (("now"() AT TIME ZONE 'America/Caracas'::"text"))::time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "return_id" "uuid",
    "stock_before" integer,
    "price_usd" numeric(12,2),
    "price_usd_before" numeric(12,2),
    "description_before" "text",
    CONSTRAINT "inventory_movements_quantity_check" CHECK ((("quantity" > 0) OR ("type" = 'edit'::"public"."movement_types")))
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."new_user_fallback_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."new_user_fallback_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(20) NOT NULL,
    "description" character varying(120) NOT NULL,
    "stock" integer NOT NULL,
    "price_usd" numeric(12,2) NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "products_price_usd_check" CHECK (("price_usd" >= (0)::numeric)),
    CONSTRAINT "products_stock_check" CHECK (("stock" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."return_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "return_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "price_usd" numeric(12,2) NOT NULL,
    "price_ves" numeric(12,2) NOT NULL,
    CONSTRAINT "return_items_price_usd_check" CHECK (("price_usd" > (0)::numeric)),
    CONSTRAINT "return_items_price_ves_check" CHECK (("price_ves" > (0)::numeric)),
    CONSTRAINT "return_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."return_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."return_types" NOT NULL,
    "credit_usd" numeric(12,2) NOT NULL,
    "credit_ves" numeric(12,2) NOT NULL,
    "difference_usd" numeric(12,2) DEFAULT 0 NOT NULL,
    "difference_ves" numeric(12,2) DEFAULT 0 NOT NULL,
    "exchange_rate" numeric(12,4) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT (("now"() AT TIME ZONE 'America/Caracas'::"text"))::"date" NOT NULL,
    "time" time without time zone DEFAULT (("now"() AT TIME ZONE 'America/Caracas'::"text"))::time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    CONSTRAINT "returns_credit_usd_check" CHECK (("credit_usd" >= (0)::numeric)),
    CONSTRAINT "returns_credit_ves_check" CHECK (("credit_ves" >= (0)::numeric)),
    CONSTRAINT "returns_exchange_rate_check" CHECK (("exchange_rate" > (0)::numeric))
);


ALTER TABLE "public"."returns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "price_usd" numeric(12,2) NOT NULL,
    "price_ves" numeric(12,2) NOT NULL,
    "exchange_rate" numeric(12,4) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT (("now"() AT TIME ZONE 'America/Caracas'::"text"))::"date" NOT NULL,
    "time" time without time zone DEFAULT (("now"() AT TIME ZONE 'America/Caracas'::"text"))::time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "total_usd" numeric(12,2) GENERATED ALWAYS AS (("price_usd" * ("quantity")::numeric)) STORED,
    "total_ves" numeric(12,2) GENERATED ALWAYS AS (("price_ves" * ("quantity")::numeric)) STORED,
    "return_id" "uuid",
    CONSTRAINT "transactions_exchange_rate_check" CHECK (("exchange_rate" > (0)::numeric)),
    CONSTRAINT "transactions_price_usd_check" CHECK (("price_usd" > (0)::numeric)),
    CONSTRAINT "transactions_price_ves_check" CHECK (("price_ves" > (0)::numeric)),
    CONSTRAINT "transactions_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "role" "public"."roles" DEFAULT 'employee'::"public"."roles" NOT NULL,
    "email" character varying(120) NOT NULL,
    "fullname" character varying(120) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_closes"
    ADD CONSTRAINT "cash_closes_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."cash_closes"
    ADD CONSTRAINT "cash_closes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."return_items"
    ADD CONSTRAINT "return_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_exchange_rates_source_date" ON "public"."exchange_rates" USING "btree" ("source", "updated_at" DESC);



CREATE INDEX "idx_inventory_movements_return" ON "public"."inventory_movements" USING "btree" ("return_id") WHERE ("return_id" IS NOT NULL);



CREATE INDEX "idx_movements_date" ON "public"."inventory_movements" USING "btree" ("date" DESC);



CREATE INDEX "idx_movements_product" ON "public"."inventory_movements" USING "btree" ("product_id");



CREATE INDEX "idx_movements_type" ON "public"."inventory_movements" USING "btree" ("type");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("active");



CREATE INDEX "idx_return_items_return" ON "public"."return_items" USING "btree" ("return_id");



CREATE INDEX "idx_returns_date" ON "public"."returns" USING "btree" ("date" DESC);



CREATE INDEX "idx_returns_user" ON "public"."returns" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_date" ON "public"."transactions" USING "btree" ("date" DESC);



CREATE INDEX "idx_transactions_employee" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_transactions_product" ON "public"."transactions" USING "btree" ("product_id");



CREATE INDEX "idx_transactions_return" ON "public"."transactions" USING "btree" ("return_id") WHERE ("return_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "on_entry_movement_sync_stock" AFTER INSERT ON "public"."inventory_movements" FOR EACH ROW EXECUTE FUNCTION "public"."sync_stock_on_entry_movement"();



CREATE OR REPLACE TRIGGER "on_product_stock_entry" AFTER INSERT OR UPDATE OF "stock" ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."log_product_entry"();



CREATE OR REPLACE TRIGGER "on_return_item_created" AFTER INSERT ON "public"."return_items" FOR EACH ROW EXECUTE FUNCTION "public"."process_return_item"();



CREATE OR REPLACE TRIGGER "on_transaction_created" AFTER INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."process_sale_transaction"();



CREATE OR REPLACE TRIGGER "trg_prevent_movement_on_inactive_product" BEFORE INSERT ON "public"."inventory_movements" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_movement_on_inactive_product"();



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."cash_closes"
    ADD CONSTRAINT "cash_closes_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."return_items"
    ADD CONSTRAINT "return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."return_items"
    ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Acceso total a usuarios logueados" ON "public"."app_settings" TO "authenticated" USING (true);



CREATE POLICY "Acceso total a usuarios logueados" ON "public"."cash_closes" TO "authenticated" USING (true);



CREATE POLICY "Acceso total a usuarios logueados" ON "public"."exchange_rates" TO "authenticated" USING (true);



CREATE POLICY "Acceso total a usuarios logueados" ON "public"."inventory_movements" TO "authenticated" USING (true);



CREATE POLICY "Acceso total a usuarios logueados" ON "public"."products" TO "authenticated" USING (true);



CREATE POLICY "Acceso total a usuarios logueados" ON "public"."transactions" TO "authenticated" USING (true);



CREATE POLICY "Acceso total a usuarios logueados" ON "public"."users" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can create returns" ON "public"."returns" FOR INSERT TO "authenticated" WITH CHECK (((("type" = 'exchange'::"public"."return_types") AND ("difference_usd" >= (0)::numeric)) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'admin'::"public"."roles"))))));



CREATE POLICY "Authenticated users can insert return_items" ON "public"."return_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can view return_items" ON "public"."return_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view returns" ON "public"."returns" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Evitar borrado de settings" ON "public"."app_settings" FOR DELETE TO "authenticated" USING (false);



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cash_closes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."return_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."returns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."edit_product"("p_product_id" "uuid", "p_code" character varying, "p_description" character varying, "p_price_usd" numeric, "p_stock" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."edit_product"("p_product_id" "uuid", "p_code" character varying, "p_description" character varying, "p_price_usd" numeric, "p_stock" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."edit_product"("p_product_id" "uuid", "p_code" character varying, "p_description" character varying, "p_price_usd" numeric, "p_stock" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."cash_closes" TO "anon";
GRANT ALL ON TABLE "public"."cash_closes" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_closes" TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_cash_close"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_cash_close"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_cash_close"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_product_entry"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_product_entry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_product_entry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_movement_on_inactive_product"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_movement_on_inactive_product"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_movement_on_inactive_product"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_return"("p_type" "text", "p_returned_items" "jsonb", "p_new_items" "jsonb", "p_exchange_rate" numeric, "p_user_id" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_return"("p_type" "text", "p_returned_items" "jsonb", "p_new_items" "jsonb", "p_exchange_rate" numeric, "p_user_id" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_return"("p_type" "text", "p_returned_items" "jsonb", "p_new_items" "jsonb", "p_exchange_rate" numeric, "p_user_id" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_return_item"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_return_item"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_return_item"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_sale_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_sale_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_sale_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_stock_on_entry_movement"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_stock_on_entry_movement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_stock_on_entry_movement"() TO "service_role";


















GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."new_user_fallback_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."new_user_fallback_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."new_user_fallback_seq" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."return_items" TO "anon";
GRANT ALL ON TABLE "public"."return_items" TO "authenticated";
GRANT ALL ON TABLE "public"."return_items" TO "service_role";



GRANT ALL ON TABLE "public"."returns" TO "anon";
GRANT ALL ON TABLE "public"."returns" TO "authenticated";
GRANT ALL ON TABLE "public"."returns" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


