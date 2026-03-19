-- ============================================================================
-- Migration: add_stock_sync_trigger_on_entry_movement
--
-- PROBLEMA:
--   La pestaña "Aumentar Existencia" del in-modal inserta directamente en
--   inventory_movements, pero nada actualiza products.stock.
--
-- SOLUCIÓN:
--   1. Crear función + trigger que al insertar un movimiento tipo 'entry',
--      sume la cantidad al stock del producto.
--   2. Modificar log_product_entry() para añadir guarda anti-recursión.
--
-- ANTI-RECURSIÓN:
--   Ambas funciones usan pg_trigger_depth() > 1 para detectar si están
--   siendo invocadas desde dentro de otro trigger y salir temprano,
--   previniendo el loop:
--     inventory_movements INSERT → products UPDATE → inventory_movements INSERT → ∞
--
-- FLUJOS VERIFICADOS:
--   ✓ "Aumentar Existencia": INSERT movement → trigger actualiza stock → fin
--   ✓ "Nuevo Producto":      INSERT product  → log_product_entry crea movement → fin
--   ✓ "Venta":               INSERT transaction → process_sale_transaction → fin
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PASO 1: Nueva función — sincroniza products.stock al insertar entry movements
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_stock_on_entry_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo procesar movimientos de tipo entrada
  IF NEW.type <> 'entry' THEN
    RETURN NEW;
  END IF;

  -- Guarda anti-recursión: si estamos dentro de otro trigger (ej. log_product_entry
  -- acaba de insertar este movement), no actualizamos stock de nuevo.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Actualizar el stock del producto sumando la cantidad del movimiento
  UPDATE public.products
  SET stock      = stock + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.sync_stock_on_entry_movement() OWNER TO postgres;

-- Crear el trigger en inventory_movements
CREATE TRIGGER on_entry_movement_sync_stock
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_stock_on_entry_movement();

-- ---------------------------------------------------------------------------
-- PASO 2: Parchear log_product_entry — añadir guarda anti-recursión
-- ---------------------------------------------------------------------------
-- MOTIVO: Cuando sync_stock_on_entry_movement hace UPDATE products.stock,
-- el trigger on_product_stock_entry dispara log_product_entry(). Sin la guarda,
-- log_product_entry insertaría un movement DUPLICADO, causando recursión infinita.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_product_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id  uuid;
  v_quantity int;
BEGIN
  -- Guarda anti-recursión: si otro trigger (sync_stock_on_entry_movement)
  -- causó este UPDATE de stock, el movement ya existe — no duplicar.
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Obtener el usuario autenticado de Supabase Auth
  v_user_id := auth.uid();

  -- Fallback para ejecución directa desde SQL Editor (sin sesión web)
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.users LIMIT 1;
  END IF;

  -- Calcular cantidad según la operación
  IF TG_OP = 'INSERT' THEN
    v_quantity := NEW.stock;
  ELSIF TG_OP = 'UPDATE' THEN
    v_quantity := NEW.stock - OLD.stock;
  END IF;

  -- Solo registrar si la diferencia es positiva (entrada real)
  IF v_quantity > 0 THEN
    INSERT INTO public.inventory_movements (
      type,
      product_id,
      quantity,
      user_id,
      date,
      time,
      created_at
    ) VALUES (
      'entry',
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
