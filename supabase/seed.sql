-- ============================================================================
-- Seed: Zapatería Inventory — Local Development Data
--
-- Creates:
--   3 users (1 admin, 2 employees) — password: password123
--   12 products (shoes with realistic Venezuelan inventory)
--   3 exchange rates (VES/USD)
--   1 app_settings row
--   15 transactions across 3 days
--   2 returns (1 exchange, 1 refund)
--   2 cash closes (completed past days)
--
-- Applied automatically on `npx supabase db reset`
-- or manually with `npx supabase db seed`
-- ============================================================================

-- ─── 1. Auth users ──────────────────────────────────────────────────────────
-- Trigger handle_new_user() auto-creates public.users rows
-- All passwords: password123

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'maria@tienda.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"María González"}',
    now() - interval '30 days', now()
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'carlos@tienda.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"Carlos Rodríguez"}',
    now() - interval '25 days', now()
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'ana@tienda.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"Ana Martínez"}',
    now() - interval '20 days', now()
  );

-- Auth identities (required for email/password login to work)
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES
  (
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'maria@tienda.com', 'email_verified', true),
    'email', now(), now() - interval '30 days', now()
  ),
  (
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000002', 'email', 'carlos@tienda.com', 'email_verified', true),
    'email', now(), now() - interval '25 days', now()
  ),
  (
    gen_random_uuid(),
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000003', 'email', 'ana@tienda.com', 'email_verified', true),
    'email', now(), now() - interval '20 days', now()
  );

-- Promote María to admin (trigger created her as 'employee')
UPDATE public.users SET role = 'admin' WHERE id = 'a0000000-0000-0000-0000-000000000001';


-- ─── 2. Products ────────────────────────────────────────────────────────────
-- Trigger log_product_entry fires → creates entry movements automatically
-- Stock values account for the 15 transactions + 2 returns that follow

INSERT INTO public.products (id, code, description, price_usd, stock) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'NK-39',  'Nike Air Max 90 Talla 39',        45.00, 20),
  ('b0000000-0000-0000-0000-000000000002', 'NK-42',  'Nike Revolution 6 Talla 42',      38.00, 25),
  ('b0000000-0000-0000-0000-000000000003', 'AD-38',  'Adidas Ultraboost 22 Talla 38',   55.00, 15),
  ('b0000000-0000-0000-0000-000000000004', 'AD-41',  'Adidas Gazelle Talla 41',         42.00, 12),
  ('b0000000-0000-0000-0000-000000000005', 'PM-40',  'Puma RS-X Talla 40',              48.00, 18),
  ('b0000000-0000-0000-0000-000000000006', 'PM-37',  'Puma Carina L Talla 37',          35.00, 22),
  ('b0000000-0000-0000-0000-000000000007', 'NB-43',  'New Balance 574 Core Talla 43',   52.00, 10),
  ('b0000000-0000-0000-0000-000000000008', 'RB-39',  'Reebok Classic Leather Talla 39', 40.00, 16),
  ('b0000000-0000-0000-0000-000000000009', 'SK-36',  'Skechers D''Lites Talla 36',      32.00, 28),
  ('b0000000-0000-0000-0000-000000000010', 'FI-44',  'Fila Disruptor II Talla 44',      30.00, 20),
  ('b0000000-0000-0000-0000-000000000011', 'CV-38',  'Converse Chuck Taylor Talla 38',  28.00, 30),
  ('b0000000-0000-0000-0000-000000000012', 'VN-41',  'Vans Old Skool Talla 41',         33.00, 24);


-- ─── 3. Exchange rates ──────────────────────────────────────────────────────
INSERT INTO public.exchange_rates (rate, source, updated_by, updated_at) VALUES
  (83.25, 'bcv',    'a0000000-0000-0000-0000-000000000001', now() - interval '7 days'),
  (84.90, 'bcv',    'a0000000-0000-0000-0000-000000000001', now() - interval '3 days'),
  (85.50, 'manual', 'a0000000-0000-0000-0000-000000000001', now() - interval '1 day');


-- ─── 4. App settings ────────────────────────────────────────────────────────
INSERT INTO public.app_settings (id, exchange_rate_mode, updated_by, updated_at) VALUES
  (1, 'manual', 'a0000000-0000-0000-0000-000000000001', now());


-- ─── 5. Transactions ────────────────────────────────────────────────────────
-- Trigger process_sale_transaction fires → decreases stock + creates exit movements
-- Exchange rate: 85.50 VES/USD
-- total_usd/total_ves are GENERATED ALWAYS columns (auto-calculated)

-- Day 1: CURRENT_DATE - 2
INSERT INTO public.transactions (product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date, time) VALUES
  ('b0000000-0000-0000-0000-000000000001', 2, 45.00, 3847.50, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 2, '09:15:00'),
  ('b0000000-0000-0000-0000-000000000003', 1, 55.00, 4702.50, 85.50, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 2, '10:30:00'),
  ('b0000000-0000-0000-0000-000000000006', 3, 35.00, 2992.50, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 2, '11:45:00'),
  ('b0000000-0000-0000-0000-000000000011', 2, 28.00, 2394.00, 85.50, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 2, '14:20:00'),
  ('b0000000-0000-0000-0000-000000000009', 1, 32.00, 2736.00, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 2, '16:00:00');

-- Day 2: CURRENT_DATE - 1
INSERT INTO public.transactions (product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date, time) VALUES
  ('b0000000-0000-0000-0000-000000000002', 2, 38.00, 3249.00, 85.50, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 1, '09:30:00'),
  ('b0000000-0000-0000-0000-000000000004', 1, 42.00, 3591.00, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 1, '10:45:00'),
  ('b0000000-0000-0000-0000-000000000010', 2, 30.00, 2565.00, 85.50, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 1, '12:15:00'),
  ('b0000000-0000-0000-0000-000000000012', 1, 33.00, 2821.50, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 1, '14:30:00'),
  ('b0000000-0000-0000-0000-000000000008', 1, 40.00, 3420.00, 85.50, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 1, '16:45:00');

-- Day 3: CURRENT_DATE (today)
INSERT INTO public.transactions (product_id, quantity, price_usd, price_ves, exchange_rate, user_id, date, time) VALUES
  ('b0000000-0000-0000-0000-000000000001', 1, 45.00, 3847.50, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:00:00'),
  ('b0000000-0000-0000-0000-000000000005', 2, 48.00, 4104.00, 85.50, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE, '10:15:00'),
  ('b0000000-0000-0000-0000-000000000009', 2, 32.00, 2736.00, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE, '11:30:00'),
  ('b0000000-0000-0000-0000-000000000007', 1, 52.00, 4446.00, 85.50, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE, '13:00:00'),
  ('b0000000-0000-0000-0000-000000000004', 1, 42.00, 3591.00, 85.50, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE, '15:30:00');


-- ─── 6. Returns via process_return() RPC ────────────────────────────────────
-- Exchange: customer returns NK-39 x1 ($45), gets AD-38 x1 ($55), pays $10
SELECT public.process_return(
  p_type          := 'exchange',
  p_returned_items := '[{"product_id":"b0000000-0000-0000-0000-000000000001","quantity":1,"price_usd":45.00,"price_ves":3847.50}]'::jsonb,
  p_new_items     := '[{"product_id":"b0000000-0000-0000-0000-000000000003","quantity":1,"price_usd":55.00,"price_ves":4702.50}]'::jsonb,
  p_exchange_rate := 85.50,
  p_user_id       := 'a0000000-0000-0000-0000-000000000002'::uuid,
  p_notes         := 'Cliente cambió talla 39 por talla 38'
);

-- Refund: customer returns SK-36 x1 ($32), admin processes full refund
SELECT public.process_return(
  p_type          := 'refund',
  p_returned_items := '[{"product_id":"b0000000-0000-0000-0000-000000000009","quantity":1,"price_usd":32.00,"price_ves":2736.00}]'::jsonb,
  p_new_items     := NULL,
  p_exchange_rate := 85.50,
  p_user_id       := 'a0000000-0000-0000-0000-000000000001'::uuid,
  p_notes         := 'Producto defectuoso — autorizado por administración'
);


-- ─── 7. Cash closes (past days only, today is still open) ───────────────────
-- Day 1: 5 txns, 9 units, $338 USD, Bs 28,899.00
INSERT INTO public.cash_closes (
  date, total_transactions, total_units_sold,
  total_usd, total_ves, exchange_rate,
  closed_by, closed_at,
  total_returns, total_returns_usd, total_returns_ves
) VALUES (
  CURRENT_DATE - 2, 5, 9,
  338.00, 28899.00, 85.50,
  'a0000000-0000-0000-0000-000000000001',
  (CURRENT_DATE - 2 + time '18:00:00')::timestamptz,
  0, 0.00, 0.00
);

-- Day 2: 5 txns, 7 units, $251 USD, Bs 21,460.50
INSERT INTO public.cash_closes (
  date, total_transactions, total_units_sold,
  total_usd, total_ves, exchange_rate,
  closed_by, closed_at,
  total_returns, total_returns_usd, total_returns_ves
) VALUES (
  CURRENT_DATE - 1, 5, 7,
  251.00, 21460.50, 85.50,
  'a0000000-0000-0000-0000-000000000001',
  (CURRENT_DATE - 1 + time '18:00:00')::timestamptz,
  0, 0.00, 0.00
);
