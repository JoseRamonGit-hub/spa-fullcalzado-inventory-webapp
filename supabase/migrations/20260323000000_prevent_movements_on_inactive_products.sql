-- Prevent creating entry movements for inactive products.
-- Sales (exit) are still allowed so remaining stock can be liquidated.
-- This is a database-level safety net complementing the UI restrictions.

CREATE OR REPLACE FUNCTION public.prevent_movement_on_inactive_product()
RETURNS trigger
LANGUAGE plpgsql
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

CREATE TRIGGER trg_prevent_movement_on_inactive_product
  BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_movement_on_inactive_product();
