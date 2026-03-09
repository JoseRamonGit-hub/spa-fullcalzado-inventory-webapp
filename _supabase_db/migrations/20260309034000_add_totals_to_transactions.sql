-- ============================================================
-- MIGRATION: add_totals_to_transactions
-- DATE:       2026-03-09
-- DESCRIPTION:
--   1. Agrega columnas GENERATED (calculadas y persistidas en la DB):
--      - total_usd = price_usd * quantity
--      - total_ves = price_ves * quantity
--      Estas columnas son inmutables: se calculan al momento del INSERT
--      y reflejan para siempre los precios y cantidades de esa venta.
--
--   2. Corrige el bug en generate_daily_cash_close():
--      Antes sumaba price_usd/price_ves unitarios (ignoraba quantity).
--      Ahora suma total_usd/total_ves correctamente.
-- ============================================================


-- ===========================================================
-- PASO 1: Agregar columnas GENERATED a la tabla transactions
-- ===========================================================
-- GENERATED ALWAYS AS ... STORED significa:
--   - PostgreSQL calcula automáticamente el valor en cada INSERT/UPDATE.
--   - El valor queda FÍSICAMENTE guardado en disco (no se recalcula en cada query).
--   - NO puedes escribir en esta columna manualmente (es de solo escritura por la DB).
--   - Es exactamente como una columna normal para el frontend: se lee igual.
-- ===========================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS total_usd numeric(12,2)
    GENERATED ALWAYS AS (price_usd * quantity) STORED,
  ADD COLUMN IF NOT EXISTS total_ves numeric(12,2)
    GENERATED ALWAYS AS (price_ves * quantity) STORED;


-- ===========================================================
-- PASO 2: Corregir generate_daily_cash_close()
-- Antes: SUM(price_usd)  → sumaba precio unitario, ignoraba cantidad
-- Ahora: SUM(total_usd)  → suma el total real de cada venta
-- ===========================================================

CREATE OR REPLACE FUNCTION public.generate_daily_cash_close(p_user_id uuid)
RETURNS public.cash_closes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_date     date;
  v_total_transactions int;
  v_total_units     int;
  v_total_usd       numeric(12,2);
  v_total_ves       numeric(12,2);
  v_exchange_rate   numeric(12,4);
  v_result          public.cash_closes;
BEGIN
  -- 1. Fijar la fecha exacta basándonos en la zona horaria de Venezuela
  v_target_date := (now() AT TIME ZONE 'America/Caracas')::date;

  -- 2. Sumar las transacciones del día usando las nuevas columnas de totales.
  --    COALESCE protege contra el caso de que no haya ventas en el día (devuelve 0).
  SELECT
    COUNT(id),
    COALESCE(SUM(quantity),  0),
    COALESCE(SUM(total_usd), 0),  -- CORREGIDO: era SUM(price_usd)
    COALESCE(SUM(total_ves), 0)   -- CORREGIDO: era SUM(price_ves)
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

  -- 4. Upsert: inserta el cierre o actualiza si ya existe para ese día
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
    total_units_sold   = EXCLUDED.total_units_sold,
    total_usd          = EXCLUDED.total_usd,
    total_ves          = EXCLUDED.total_ves,
    exchange_rate      = EXCLUDED.exchange_rate,
    closed_by          = EXCLUDED.closed_by,
    closed_at          = EXCLUDED.closed_at
  RETURNING * INTO v_result;

  -- 5. Devolver el recibo final al Frontend
  RETURN v_result;
END;
$$;
