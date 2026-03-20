-- ============================================================================
-- TEST SUITE: stock_sync_trigger
--
-- Valida los 3 flujos críticos del trigger sync_stock_on_entry_movement()
-- y la guarda anti-recursión en log_product_entry().
--
-- FLUJOS TESTEADOS:
--   TEST 1 — "Aumentar Existencia": INSERT directo en inventory_movements
--            con type='entry' → stock del producto DEBE aumentar.
--
--   TEST 2 — "Nuevo Producto": INSERT en products con stock inicial > 0
--            → log_product_entry() crea un movement, pero sync_stock NO
--            debe re-sumar (anti-recursión). Stock queda intacto.
--
--   TEST 3 — "Venta" (movimiento tipo 'exit'): INSERT en inventory_movements
--            con type='exit' → stock del producto NO debe cambiar
--            (el trigger solo actúa en type='entry').
--
-- FRAMEWORK: pgTAP 1.3 (https://pgtap.org)
-- EJECUTAR:  npx supabase test db
-- ============================================================================

BEGIN;

-- Cargar pgTAP
SELECT plan(9);
-- 9 assertions totales: 3 tests × 3 checks cada uno (stock antes, acción, stock después)

-- ============================================================================
-- SETUP: Crear datos de prueba aislados dentro de la transacción
-- ============================================================================

-- Obtener un user_id válido (necesario para FK en inventory_movements)
DO $$
BEGIN
  -- Crear usuario de prueba si no existe ninguno
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

-- Producto de prueba con stock inicial 0 (insertado sin trigger de log
-- deshabilitando temporalmente el trigger para tener control total)
ALTER TABLE public.products DISABLE TRIGGER on_product_stock_entry;

INSERT INTO public.products (id, code, description, stock, price_usd, active)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'TEST-TRIGGER-001',
  'Producto de prueba para test de trigger',
  0,
  10.00,
  true
);

-- Producto separado para el Test 2 (Nuevo Producto)
INSERT INTO public.products (id, code, description, stock, price_usd, active)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'TEST-TRIGGER-002',
  'Producto de prueba para test de nuevo producto',
  0,
  15.00,
  true
);

ALTER TABLE public.products ENABLE TRIGGER on_product_stock_entry;

-- ============================================================================
-- TEST 1: "Aumentar Existencia"
-- Escenario: El usuario abre el in-modal, selecciona un producto y agrega
--            +5 unidades. El frontend hace INSERT en inventory_movements.
-- Esperado:  El trigger sync_stock_on_entry_movement() suma 5 al stock.
-- ============================================================================

-- 1a. Verificar estado inicial: stock = 0
SELECT is(
  (SELECT stock FROM public.products WHERE id = '11111111-1111-1111-1111-111111111111'),
  0,
  'TEST 1a: Stock inicial del producto es 0 antes de insertar movement'
);

-- 1b. Simular "Aumentar Existencia": INSERT directo en inventory_movements
INSERT INTO public.inventory_movements (type, product_id, quantity, user_id, date, time)
VALUES (
  'entry',
  '11111111-1111-1111-1111-111111111111',
  5,
  (SELECT id FROM public.users LIMIT 1),
  current_date,
  current_time
);

-- 1c. Verificar que el stock se actualizó correctamente
SELECT is(
  (SELECT stock FROM public.products WHERE id = '11111111-1111-1111-1111-111111111111'),
  5,
  'TEST 1b: Stock aumentó a 5 después de INSERT entry con quantity=5'
);

-- 1d. Insertar otra entrada para verificar acumulación
INSERT INTO public.inventory_movements (type, product_id, quantity, user_id, date, time)
VALUES (
  'entry',
  '11111111-1111-1111-1111-111111111111',
  3,
  (SELECT id FROM public.users LIMIT 1),
  current_date,
  current_time
);

SELECT is(
  (SELECT stock FROM public.products WHERE id = '11111111-1111-1111-1111-111111111111'),
  8,
  'TEST 1c: Stock acumulado correctamente a 8 (5+3) tras segunda entrada'
);

-- ============================================================================
-- TEST 2: "Nuevo Producto" (anti-recursión)
-- Escenario: El usuario crea un producto nuevo con stock=10 desde el form.
--            El trigger on_product_stock_entry dispara log_product_entry(),
--            que inserta un movement tipo 'entry'. Ese INSERT dispara
--            sync_stock_on_entry_movement(), que detecta pg_trigger_depth()>1
--            y NO re-suma al stock.
-- Esperado:  Stock queda en 10 (no en 20 por doble suma).
--            Se crea exactamente 1 movement de tipo 'entry'.
-- ============================================================================

-- 2a. Contar movements antes de la operación
SELECT is(
  (SELECT count(*)::int FROM public.inventory_movements
   WHERE product_id = '22222222-2222-2222-2222-222222222222'),
  0,
  'TEST 2a: No hay movements para el producto antes de asignar stock'
);

-- 2b. Simular "Nuevo Producto": UPDATE stock de 0 a 10 (como haría el form)
--     Esto dispara on_product_stock_entry → log_product_entry()
UPDATE public.products
SET stock = 10, updated_at = now()
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 2c. Verificar que stock quedó en 10 (NO en 20)
SELECT is(
  (SELECT stock FROM public.products WHERE id = '22222222-2222-2222-2222-222222222222'),
  10,
  'TEST 2b: Stock es 10 (no 20). Anti-recursión evitó doble suma'
);

-- 2d. Verificar que se creó exactamente 1 movement (no duplicados)
SELECT is(
  (SELECT count(*)::int FROM public.inventory_movements
   WHERE product_id = '22222222-2222-2222-2222-222222222222'
     AND type = 'entry'),
  1,
  'TEST 2c: Se creó exactamente 1 movement entry (sin duplicados por recursión)'
);

-- ============================================================================
-- TEST 3: "Venta" (movimiento tipo 'exit')
-- Escenario: Se registra una venta que genera un movement tipo 'exit'.
--            El trigger sync_stock_on_entry_movement() debe IGNORARLO
--            porque solo procesa type='entry'.
-- Esperado:  El stock del producto NO cambia.
-- ============================================================================

-- 3a. Capturar stock actual antes de la "venta"
SELECT is(
  (SELECT stock FROM public.products WHERE id = '11111111-1111-1111-1111-111111111111'),
  8,
  'TEST 3a: Stock es 8 antes del movimiento exit'
);

-- 3b. Simular movimiento de salida (venta)
INSERT INTO public.inventory_movements (type, product_id, quantity, user_id, date, time)
VALUES (
  'exit',
  '11111111-1111-1111-1111-111111111111',
  2,
  (SELECT id FROM public.users LIMIT 1),
  current_date,
  current_time
);

-- 3c. Verificar que el stock NO cambió
SELECT is(
  (SELECT stock FROM public.products WHERE id = '11111111-1111-1111-1111-111111111111'),
  8,
  'TEST 3c-1: Stock sigue en 8 — trigger ignoró movement tipo exit'
);

-- 3d. Confirmar que el movement exit sí se insertó (el trigger no lo bloqueó)
SELECT is(
  (SELECT count(*)::int FROM public.inventory_movements
   WHERE product_id = '11111111-1111-1111-1111-111111111111'
     AND type = 'exit'),
  1,
  'TEST 3c-2: El movement exit sí se registró en la tabla (no fue bloqueado)'
);

-- ============================================================================
-- TEARDOWN
-- ============================================================================
SELECT * FROM finish();

-- ROLLBACK asegura que NINGÚN dato de prueba persiste en la DB local.
-- Esto hace los tests completamente idempotentes y seguros de ejecutar N veces.
ROLLBACK;
