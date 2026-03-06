--
-- PostgreSQL database dump
--

\restrict x5o07BowdORPPDBWHnRA3z5tYq0sgg2CsYaxqXXiLSTQcL66U9PL6gBCU3Suer4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: exchange_modes; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.exchange_modes AS ENUM (
    'manual',
    'bcv'
);


ALTER TYPE public.exchange_modes OWNER TO postgres;

--
-- Name: movement_types; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.movement_types AS ENUM (
    'entry',
    'exit'
);


ALTER TYPE public.movement_types OWNER TO postgres;

--
-- Name: roles; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.roles AS ENUM (
    'admin',
    'employee'
);


ALTER TYPE public.roles OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cash_closes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_closes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date DEFAULT ((now() AT TIME ZONE 'America/Caracas'::text))::date NOT NULL,
    total_transactions integer DEFAULT 0 NOT NULL,
    total_units_sold integer DEFAULT 0 NOT NULL,
    total_usd numeric(12,2) DEFAULT 0 NOT NULL,
    total_ves numeric(12,2) DEFAULT 0 NOT NULL,
    exchange_rate numeric(12,4) NOT NULL,
    closed_by uuid NOT NULL,
    closed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cash_closes OWNER TO postgres;

--
-- Name: generate_daily_cash_close(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_daily_cash_close(p_user_id uuid) RETURNS public.cash_closes
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_target_date date;
  v_total_transactions int;
  v_total_units int;
  v_total_usd numeric(12,2);
  v_total_ves numeric(12,2);
  v_exchange_rate numeric(12,4);
  v_result public.cash_closes;
BEGIN
  -- 1. Fijar la fecha exacta basándonos en la zona horaria de Venezuela
  v_target_date := (now() AT TIME ZONE 'America/Caracas')::date;

  -- 2. Sumar las transacciones del día
  -- Usamos COALESCE para que, si no hay ventas (NULL), devuelva 0 y no rompa la matemática.
  SELECT 
    COUNT(id),
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(price_usd), 0),
    COALESCE(SUM(price_ves), 0)
  INTO 
    v_total_transactions,
    v_total_units,
    v_total_usd,
    v_total_ves
  FROM public.transactions
  WHERE date = v_target_date;

  -- 3. Obtener la tasa de cambio activa para este cierre
  SELECT rate INTO v_exchange_rate 
  FROM public.exchange_rates 
  ORDER BY updated_at DESC LIMIT 1;
  
  IF v_exchange_rate IS NULL THEN
    v_exchange_rate := 0;
  END IF;

  -- 4. Bloque de Contingencia (Upsert)
  -- Intenta insertar. Si la fecha ya existe (conflicto), simplemente actualiza los totales.
  INSERT INTO public.cash_closes (
    date,
    total_transactions,
    total_units_sold,
    total_usd,
    total_ves,
    exchange_rate,
    closed_by,
    closed_at
  ) VALUES (
    v_target_date,
    v_total_transactions,
    v_total_units,
    v_total_usd,
    v_total_ves,
    v_exchange_rate,
    p_user_id,
    now()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_transactions = EXCLUDED.total_transactions,
    total_units_sold = EXCLUDED.total_units_sold,
    total_usd = EXCLUDED.total_usd,
    total_ves = EXCLUDED.total_ves,
    exchange_rate = EXCLUDED.exchange_rate,
    closed_by = EXCLUDED.closed_by,
    closed_at = EXCLUDED.closed_at
  RETURNING * INTO v_result;

  -- 5. Devolver el recibo final al Frontend
  RETURN v_result;
END;
$$;


ALTER FUNCTION public.generate_daily_cash_close(p_user_id uuid) OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: log_product_entry(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_product_entry() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
  v_quantity int;
BEGIN
  -- Supabase Auth: Obtiene el ID del usuario logueado que hace la petición
  v_user_id := auth.uid();

  -- EXPLIOT PARA PRUEBAS LÓGICAS:
  -- Si ejecutas código directamente desde el SQL Editor, no hay un usuario web logueado (auth.uid() es NULL).
  -- Como la tabla exige un user_id, buscamos el primer usuario disponible como respaldo para que no falle la prueba.
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.users LIMIT 1;
  END IF;

  -- Lógica condicional: ¿Es un producto nuevo o una actualización?
  IF TG_OP = 'INSERT' THEN
    v_quantity := NEW.stock; -- Toda la cantidad inicial es una entrada
  ELSIF TG_OP = 'UPDATE' THEN
    v_quantity := NEW.stock - OLD.stock; -- Solo registramos la diferencia positiva
  END IF;

  -- Si la cantidad matemática es mayor a cero, disparamos el registro
  IF v_quantity > 0 THEN
    INSERT INTO public.inventory_movements (
      type,
      product_id,
      quantity,
      user_id, -- El usuario obtenido arriba
      date,
      time,
      created_at
    ) VALUES (
      'entry', -- Enum definido en tu DBML
      NEW.id,
      v_quantity,
      v_user_id,
      current_date,
      current_time,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_product_entry() OWNER TO postgres;

--
-- Name: process_sale_transaction(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_sale_transaction() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Paso A: Restar el stock en la tabla de productos
  UPDATE public.products
  SET stock = stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  -- Paso B: Insertar automáticamente el registro en el historial de movimientos
  INSERT INTO public.inventory_movements (
    type,
    product_id,
    quantity,
    user_id,
    date,
    time,
    created_at
  ) VALUES (
    'exit', -- Enum definido para salidas
    NEW.product_id,
    NEW.quantity,
    NEW.user_id,
    NEW.date,
    NEW.time,
    NEW.created_at
  );

  -- Retornar la fila recién insertada en transactions para completar la operación
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.process_sale_transaction() OWNER TO postgres;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_settings (
    id integer DEFAULT 1 NOT NULL,
    exchange_rate_mode public.exchange_modes DEFAULT 'manual'::public.exchange_modes,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT app_settings_id_check CHECK ((id = 1))
);


ALTER TABLE public.app_settings OWNER TO postgres;

--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exchange_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rate numeric(12,4) NOT NULL,
    source public.exchange_modes NOT NULL,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT exchange_rates_rate_check CHECK ((rate >= (0)::numeric))
);


ALTER TABLE public.exchange_rates OWNER TO postgres;

--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public.movement_types NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT ((now() AT TIME ZONE 'America/Caracas'::text))::date NOT NULL,
    "time" time without time zone DEFAULT ((now() AT TIME ZONE 'America/Caracas'::text))::time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT inventory_movements_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.inventory_movements OWNER TO postgres;

--
-- Name: new_user_fallback_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.new_user_fallback_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.new_user_fallback_seq OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20) NOT NULL,
    description character varying(120) NOT NULL,
    stock integer NOT NULL,
    price_usd numeric(12,2) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_price_usd_check CHECK ((price_usd >= (0)::numeric)),
    CONSTRAINT products_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    price_usd numeric(12,2) NOT NULL,
    price_ves numeric(12,2) NOT NULL,
    exchange_rate numeric(12,4) NOT NULL,
    user_id uuid NOT NULL,
    date date DEFAULT ((now() AT TIME ZONE 'America/Caracas'::text))::date NOT NULL,
    "time" time without time zone DEFAULT ((now() AT TIME ZONE 'America/Caracas'::text))::time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT transactions_exchange_rate_check CHECK ((exchange_rate > (0)::numeric)),
    CONSTRAINT transactions_price_usd_check CHECK ((price_usd > (0)::numeric)),
    CONSTRAINT transactions_price_ves_check CHECK ((price_ves > (0)::numeric)),
    CONSTRAINT transactions_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    role public.roles DEFAULT 'employee'::public.roles NOT NULL,
    email character varying(120) NOT NULL,
    fullname character varying(120) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: cash_closes cash_closes_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_closes
    ADD CONSTRAINT cash_closes_date_key UNIQUE (date);


--
-- Name: cash_closes cash_closes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_closes
    ADD CONSTRAINT cash_closes_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: products products_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_code_key UNIQUE (code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_exchange_rates_source_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_rates_source_date ON public.exchange_rates USING btree (source, updated_at DESC);


--
-- Name: idx_movements_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movements_date ON public.inventory_movements USING btree (date DESC);


--
-- Name: idx_movements_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movements_product ON public.inventory_movements USING btree (product_id);


--
-- Name: idx_movements_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movements_type ON public.inventory_movements USING btree (type);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active ON public.products USING btree (active);


--
-- Name: idx_transactions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date DESC);


--
-- Name: idx_transactions_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_employee ON public.transactions USING btree (user_id);


--
-- Name: idx_transactions_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_product ON public.transactions USING btree (product_id);


--
-- Name: products on_product_stock_entry; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_product_stock_entry AFTER INSERT OR UPDATE OF stock ON public.products FOR EACH ROW EXECUTE FUNCTION public.log_product_entry();


--
-- Name: transactions on_transaction_created; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER on_transaction_created AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.process_sale_transaction();


--
-- Name: app_settings app_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: cash_closes cash_closes_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_closes
    ADD CONSTRAINT cash_closes_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id);


--
-- Name: exchange_rates exchange_rates_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: inventory_movements inventory_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: inventory_movements inventory_movements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: app_settings Evitar borrado de settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Evitar borrado de settings" ON public.app_settings FOR DELETE TO authenticated USING (false);


--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: TABLE cash_closes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cash_closes TO anon;
GRANT ALL ON TABLE public.cash_closes TO authenticated;
GRANT ALL ON TABLE public.cash_closes TO service_role;


--
-- Name: FUNCTION generate_daily_cash_close(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_daily_cash_close(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.generate_daily_cash_close(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.generate_daily_cash_close(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION log_product_entry(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_product_entry() TO anon;
GRANT ALL ON FUNCTION public.log_product_entry() TO authenticated;
GRANT ALL ON FUNCTION public.log_product_entry() TO service_role;


--
-- Name: FUNCTION process_sale_transaction(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_sale_transaction() TO anon;
GRANT ALL ON FUNCTION public.process_sale_transaction() TO authenticated;
GRANT ALL ON FUNCTION public.process_sale_transaction() TO service_role;


--
-- Name: TABLE app_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.app_settings TO anon;
GRANT ALL ON TABLE public.app_settings TO authenticated;
GRANT ALL ON TABLE public.app_settings TO service_role;


--
-- Name: TABLE exchange_rates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.exchange_rates TO anon;
GRANT ALL ON TABLE public.exchange_rates TO authenticated;
GRANT ALL ON TABLE public.exchange_rates TO service_role;


--
-- Name: TABLE inventory_movements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.inventory_movements TO anon;
GRANT ALL ON TABLE public.inventory_movements TO authenticated;
GRANT ALL ON TABLE public.inventory_movements TO service_role;


--
-- Name: SEQUENCE new_user_fallback_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.new_user_fallback_seq TO anon;
GRANT ALL ON SEQUENCE public.new_user_fallback_seq TO authenticated;
GRANT ALL ON SEQUENCE public.new_user_fallback_seq TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict x5o07BowdORPPDBWHnRA3z5tYq0sgg2CsYaxqXXiLSTQcL66U9PL6gBCU3Suer4

