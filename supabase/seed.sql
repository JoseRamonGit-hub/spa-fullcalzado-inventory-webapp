-- ============================================================================
-- Seed: Zapateria Inventory - Local Development Dataset
--
-- This seed is designed for local Supabase resets and manual seeding.
-- It creates deterministic data that exercises all current database flows:
--   - auth users + public.users trigger
--   - exchange rate history + app settings
--   - products in multiple states (active, inactive, zero stock)
--   - inventory entry movements (manual restock + new product auto-entry)
--   - single-line and multi-line sales with generated exit movements
--   - returns: exchange with positive diff, refund, exchange with negative diff
--   - product edits: price-only and stock/price/description edit
--   - paginated product history with 21 audited price edits
--   - historical cash closes for previous days
--   - section 11: 40 days of extended history in both businesses (no rows
--     dated today): stock states, Cashea orders in every state, deposits
--     and daily cash closes with the Cashea breakdown
--
-- Login credentials for all seeded users: password123
-- Assignments:
--   maria@tienda.com  -> admin (oldest user: some tests promote the oldest one), can access both businesses, defaults to Full
--   carlos@tienda.com -> employee, Full Calzado
--   ana@tienda.com    -> employee, Full Calzado + Zapatería Estilos, defaults to Full
--   luis@tienda.com   -> employee, Zapatería Estilos
--   pedro@tienda.com  -> inactive employee, sold in Full Calzado until 20 days ago
-- ============================================================================

BEGIN;

-- Match the business date used by generate_daily_cash_close and the sale RPCs.
SET LOCAL TIME ZONE 'America/Caracas';

-- The production migration intentionally leaves tenant columns without a
-- default. Temporary defaults keep this historical dataset readable while
-- making every omitted business_id belong to Full Calzado. They are removed
-- before COMMIT.
ALTER TABLE public.products
  ALTER COLUMN business_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.inventory_movements
  ALTER COLUMN business_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.transactions
  ALTER COLUMN business_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.returns
  ALTER COLUMN business_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.return_items
  ALTER COLUMN business_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.cash_closes
  ALTER COLUMN business_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.exchange_rates
  ALTER COLUMN business_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::uuid;

-- ─── 0. Cleanup previous seeded rows ─────────────────────────────────────────

CREATE TEMP TABLE seed_actor_ids (id uuid PRIMARY KEY) ON COMMIT DROP;

INSERT INTO seed_actor_ids (id) VALUES
  ('a0000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000003'),
  ('a0000000-0000-0000-0000-000000000004'),
  ('a0000000-0000-0000-0000-000000000005');

DELETE FROM public.cashea_order_adjustments
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
);

DELETE FROM public.cashea_orders
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
);

DELETE FROM public.cashea_deposits
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
);

DELETE FROM public.inventory_movements
WHERE product_id IN (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000009',
  'b0000000-0000-0000-0000-000000000010',
  'b0000000-0000-0000-0000-000000000011',
  'b0000000-0000-0000-0000-000000000012',
  'b0000000-0000-0000-0000-000000000013',
  'b0000000-0000-0000-0000-000000000014',
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002'
)
OR product_id::text LIKE 'b2000000-%'
OR product_id::text LIKE 'b3000000-%'
OR return_id IN (
  SELECT id
  FROM public.returns
  WHERE notes IN (
    'Cambio talla cliente runner',
    'Reintegro por defecto de fabrica',
    'Cambio administrado con saldo a favor'
  )
);

DELETE FROM public.transactions
WHERE id IN (
  'd0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000006',
  'd0000000-0000-0000-0000-000000000007',
  'd0000000-0000-0000-0000-000000000008',
  'd0000000-0000-0000-0000-000000000009',
  'd0000000-0000-0000-0000-000000000010',
  'd0000000-0000-0000-0000-000000000011',
  'd0000000-0000-0000-0000-000000000012',
  'd0000000-0000-0000-0000-000000000013',
  'd0000000-0000-0000-0000-000000000014',
  'd0000000-0000-0000-0000-000000000015',
  'd0000000-0000-0000-0000-000000000016',
  'd1000000-0000-0000-0000-000000000001'
)
OR business_id = '10000000-0000-0000-0000-000000000002'
OR user_id IN (SELECT id FROM seed_actor_ids)
OR return_id IN (
  SELECT id
  FROM public.returns
  WHERE notes IN (
    'Cambio talla cliente runner',
    'Reintegro por defecto de fabrica',
    'Cambio administrado con saldo a favor'
  )
);

DELETE FROM public.sales
WHERE business_id = '10000000-0000-0000-0000-000000000002'
OR user_id IN (SELECT id FROM seed_actor_ids);

DELETE FROM public.return_items
WHERE return_id IN (
  SELECT id
  FROM public.returns
  WHERE user_id IN (SELECT id FROM seed_actor_ids)
  OR notes IN (
    'Cambio talla cliente runner',
    'Reintegro por defecto de fabrica',
    'Cambio administrado con saldo a favor'
  )
);

DELETE FROM public.returns
WHERE user_id IN (SELECT id FROM seed_actor_ids)
OR notes IN (
  'Cambio talla cliente runner',
  'Reintegro por defecto de fabrica',
  'Cambio administrado con saldo a favor'
);

DELETE FROM public.cash_closes
WHERE id IN (
  'e0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'e0000000-0000-0000-0000-000000000003'
)
OR business_id = '10000000-0000-0000-0000-000000000002'
OR closed_by IN (SELECT id FROM seed_actor_ids);

DELETE FROM public.exchange_rates
WHERE id IN (
  'f0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000003',
  'f0000000-0000-0000-0000-000000000004',
  'f1000000-0000-0000-0000-000000000001'
)
OR business_id = '10000000-0000-0000-0000-000000000002'
OR updated_by IN (SELECT id FROM seed_actor_ids);

DELETE FROM public.app_settings
WHERE business_id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
);

DELETE FROM public.products
WHERE code IN (
  'NK-39',
  'NK-42',
  'AD-38',
  'AD-41',
  'PM-40',
  'PM-37',
  'NB-43',
  'RB-39',
  'SK-36',
  'CV-38',
  'VN-41',
  'AS-35',
  'DC-40',
  'OT-42',
  'NK-39',
  'EST-40'
)
OR id::text LIKE 'b2000000-%'
OR id::text LIKE 'b3000000-%';

DELETE FROM auth.identities
WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

DELETE FROM auth.users
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
)
OR email IN (
  'maria@tienda.com',
  'carlos@tienda.com',
  'ana@tienda.com',
  'luis@tienda.com',
  'pedro@tienda.com'
);

-- ─── 1. Auth users ──────────────────────────────────────────────────────────

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'maria@tienda.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"Maria Admin"}',
    now() - interval '60 days',
    now() - interval '60 days',
    ''
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'carlos@tienda.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"Carlos Perez"}',
    now() - interval '45 days',
    now() - interval '45 days',
    ''
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ana@tienda.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"Ana Morales"}',
    now() - interval '42 days',
    now() - interval '42 days',
    ''
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'luis@tienda.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"Luis Rojas"}',
    now() - interval '38 days',
    now() - interval '38 days',
    ''
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pedro@tienda.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"fullname":"Pedro Salazar"}',
    now() - interval '50 days',
    now() - interval '50 days',
    ''
  );

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'maria@tienda.com', 'email_verified', true),
    'email',
    now() - interval '1 day',
    now() - interval '60 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000002', 'email', 'carlos@tienda.com', 'email_verified', true),
    'email',
    now() - interval '1 day',
    now() - interval '45 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000003', 'email', 'ana@tienda.com', 'email_verified', true),
    'email',
    now() - interval '1 day',
    now() - interval '42 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000004', 'email', 'luis@tienda.com', 'email_verified', true),
    'email',
    now() - interval '1 day',
    now() - interval '38 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000005',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000005', 'email', 'pedro@tienda.com', 'email_verified', true),
    'email',
    now() - interval '21 days',
    now() - interval '50 days',
    now() - interval '21 days'
  );

UPDATE public.users
SET role = CASE id
    WHEN 'a0000000-0000-0000-0000-000000000001' THEN 'admin'::public.roles
    ELSE 'employee'::public.roles
  END,
  is_active = true,
  created_at = CASE id
    WHEN 'a0000000-0000-0000-0000-000000000001' THEN now() - interval '60 days'
    WHEN 'a0000000-0000-0000-0000-000000000002' THEN now() - interval '45 days'
    WHEN 'a0000000-0000-0000-0000-000000000003' THEN now() - interval '42 days'
    WHEN 'a0000000-0000-0000-0000-000000000005' THEN now() - interval '50 days'
    ELSE now() - interval '38 days'
  END,
  updated_at = now() - interval '1 day'
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

UPDATE public.users
SET default_business_id = CASE id
    WHEN 'a0000000-0000-0000-0000-000000000004'
      THEN '10000000-0000-0000-0000-000000000002'::uuid
    ELSE '10000000-0000-0000-0000-000000000001'::uuid
  END
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

DELETE FROM public.user_business_access
WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005'
);

INSERT INTO public.user_business_access (user_id, business_id)
VALUES
  (
    'a0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002'
  ),
  -- Pedro pierde este acceso al final de la sección 11, cuando se desactiva.
  (
    'a0000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000001'
  );

-- Trigger functions no longer invent a fallback actor. Seed operations that
-- exercise application RPCs use an explicit authenticated identity.
SELECT set_config(
  'request.jwt.claim.sub',
  'a0000000-0000-0000-0000-000000000001',
  true
);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

-- ─── 2. Products ────────────────────────────────────────────────────────────

INSERT INTO public.products (
  id,
  code,
  description,
  stock,
  price_usd,
  active,
  created_at,
  updated_at
) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'NK-39', 'Nike Air Max 90 T39', 0, 45.00, true, now() - interval '20 days', now() - interval '20 days'),
  ('b0000000-0000-0000-0000-000000000002', 'NK-42', 'Nike Revolution 6 T42', 0, 39.00, true, now() - interval '19 days', now() - interval '19 days'),
  ('b0000000-0000-0000-0000-000000000003', 'AD-38', 'Adidas Ultraboost 22 T38', 0, 56.00, true, now() - interval '18 days', now() - interval '18 days'),
  ('b0000000-0000-0000-0000-000000000004', 'AD-41', 'Adidas Gazelle T41', 0, 43.00, true, now() - interval '17 days', now() - interval '17 days'),
  ('b0000000-0000-0000-0000-000000000005', 'PM-40', 'Puma RS-X T40', 0, 49.00, true, now() - interval '16 days', now() - interval '16 days'),
  ('b0000000-0000-0000-0000-000000000006', 'PM-37', 'Puma Carina L T37', 0, 37.00, true, now() - interval '15 days', now() - interval '15 days'),
  ('b0000000-0000-0000-0000-000000000007', 'NB-43', 'New Balance 574 Core T43', 0, 53.00, true, now() - interval '14 days', now() - interval '14 days'),
  ('b0000000-0000-0000-0000-000000000008', 'RB-39', 'Reebok Classic Leather T39', 0, 41.00, true, now() - interval '13 days', now() - interval '13 days'),
  ('b0000000-0000-0000-0000-000000000009', 'SK-36', 'Skechers D-Lites T36', 0, 32.79, true, now() - interval '12 days', now() - interval '12 days'),
  ('b0000000-0000-0000-0000-000000000010', 'CV-38', 'Converse Chuck Taylor T38', 0, 29.00, true, now() - interval '11 days', now() - interval '11 days'),
  ('b0000000-0000-0000-0000-000000000011', 'VN-41', 'Vans Old Skool T41', 0, 31.00, true, now() - interval '10 days', now() - interval '10 days'),
  ('b0000000-0000-0000-0000-000000000012', 'AS-35', 'Asics Gel-Contend T35', 0, 36.00, true, now() - interval '9 days', now() - interval '9 days'),
  ('b0000000-0000-0000-0000-000000000013', 'DC-40', 'DC Court Vulc T40', 0, 34.00, true, now() - interval '8 days', now() - interval '8 days'),
  ('b0000000-0000-0000-0000-000000000014', 'OT-42', 'Onitsuka Tiger Mexico 66 T42', 7, 61.00, true, now() - interval '6 days', now() - interval '6 days');

UPDATE public.inventory_movements
SET date = CURRENT_DATE - 6,
    time = '09:20:00',
    created_at = ((CURRENT_DATE - 6)::timestamp + time '09:20:00') AT TIME ZONE 'America/Caracas'
WHERE product_id = 'b0000000-0000-0000-0000-000000000014'
  AND type = 'entry';

INSERT INTO public.inventory_movements (
  id,
  type,
  product_id,
  quantity,
  user_id,
  date,
  time,
  created_at,
  stock_before,
  price_usd
) VALUES
  ('11111111-0000-0000-0000-000000000001', 'entry', 'b0000000-0000-0000-0000-000000000001', 18, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, '09:00:00', ((CURRENT_DATE - 18)::timestamp + time '09:00:00') AT TIME ZONE 'America/Caracas', 0, 45.00),
  ('11111111-0000-0000-0000-000000000002', 'entry', 'b0000000-0000-0000-0000-000000000002', 20, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, '09:10:00', ((CURRENT_DATE - 18)::timestamp + time '09:10:00') AT TIME ZONE 'America/Caracas', 0, 39.00),
  ('11111111-0000-0000-0000-000000000003', 'entry', 'b0000000-0000-0000-0000-000000000003', 12, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, '10:00:00', ((CURRENT_DATE - 17)::timestamp + time '10:00:00') AT TIME ZONE 'America/Caracas', 0, 56.00),
  ('11111111-0000-0000-0000-000000000004', 'entry', 'b0000000-0000-0000-0000-000000000004', 10, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, '10:10:00', ((CURRENT_DATE - 17)::timestamp + time '10:10:00') AT TIME ZONE 'America/Caracas', 0, 43.00),
  ('11111111-0000-0000-0000-000000000005', 'entry', 'b0000000-0000-0000-0000-000000000005', 14, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, '11:00:00', ((CURRENT_DATE - 16)::timestamp + time '11:00:00') AT TIME ZONE 'America/Caracas', 0, 49.00),
  ('11111111-0000-0000-0000-000000000006', 'entry', 'b0000000-0000-0000-0000-000000000006', 16, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, '11:10:00', ((CURRENT_DATE - 16)::timestamp + time '11:10:00') AT TIME ZONE 'America/Caracas', 0, 37.00),
  ('11111111-0000-0000-0000-000000000007', 'entry', 'b0000000-0000-0000-0000-000000000007', 8, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, '09:30:00', ((CURRENT_DATE - 15)::timestamp + time '09:30:00') AT TIME ZONE 'America/Caracas', 0, 53.00),
  ('11111111-0000-0000-0000-000000000008', 'entry', 'b0000000-0000-0000-0000-000000000008', 11, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, '09:40:00', ((CURRENT_DATE - 15)::timestamp + time '09:40:00') AT TIME ZONE 'America/Caracas', 0, 41.00),
  ('11111111-0000-0000-0000-000000000009', 'entry', 'b0000000-0000-0000-0000-000000000009', 15, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, '10:20:00', ((CURRENT_DATE - 14)::timestamp + time '10:20:00') AT TIME ZONE 'America/Caracas', 0, 33.00),
  ('11111111-0000-0000-0000-000000000010', 'entry', 'b0000000-0000-0000-0000-000000000010', 6, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, '10:30:00', ((CURRENT_DATE - 14)::timestamp + time '10:30:00') AT TIME ZONE 'America/Caracas', 0, 29.00),
  ('11111111-0000-0000-0000-000000000011', 'entry', 'b0000000-0000-0000-0000-000000000012', 9, 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, '11:00:00', ((CURRENT_DATE - 13)::timestamp + time '11:00:00') AT TIME ZONE 'America/Caracas', 0, 36.00);

-- Keep one deterministic product above the 20-row client page size. These
-- events are created through the production function so the fixture exercises
-- the same immutable audit fields as a real price edit. The final price is the
-- $33.00 used by the sales below.
DO $$
DECLARE
  step_index integer;
  movement_id uuid;
BEGIN
  FOR step_index IN 1..21 LOOP
    PERFORM public.edit_product(
      p_business_id := '10000000-0000-0000-0000-000000000001'::uuid,
      p_product_id  := 'b0000000-0000-0000-0000-000000000009'::uuid,
      p_price_usd   := 32.79 + (step_index::numeric / 100)
    );

    SELECT id
    INTO movement_id
    FROM public.inventory_movements
    WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
      AND product_id = 'b0000000-0000-0000-0000-000000000009'::uuid
      AND type = 'edit'
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    UPDATE public.inventory_movements
    SET date = CURRENT_DATE - 12,
        time = time '11:00:00' + make_interval(mins => step_index),
        created_at = (
          (CURRENT_DATE - 12)::timestamp
          + time '11:00:00'
          + make_interval(mins => step_index)
        ) AT TIME ZONE 'America/Caracas'
    WHERE id = movement_id;
  END LOOP;

  UPDATE public.products
  SET updated_at = (
    (CURRENT_DATE - 12)::timestamp + time '11:21:00'
  ) AT TIME ZONE 'America/Caracas'
  WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
    AND id = 'b0000000-0000-0000-0000-000000000009'::uuid;
END
$$;

-- ─── 3. Exchange rates and settings ─────────────────────────────────────────

INSERT INTO public.exchange_rates (id, rate, source, updated_by, updated_at) VALUES
  ('f0000000-0000-0000-0000-000000000001', 83.25, 'bcv', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 10)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas'),
  ('f0000000-0000-0000-0000-000000000002', 84.10, 'bcv', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 7)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas'),
  ('f0000000-0000-0000-0000-000000000003', 86.00, 'manual', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 3)::timestamp + time '08:30:00') AT TIME ZONE 'America/Caracas'),
  ('f0000000-0000-0000-0000-000000000004', 87.75, 'manual', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 1)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas');

INSERT INTO public.app_settings (business_id, exchange_rate_mode, updated_by, updated_at)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'manual',
    'a0000000-0000-0000-0000-000000000001',
    ((CURRENT_DATE - 1)::timestamp + time '08:05:00') AT TIME ZONE 'America/Caracas'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'manual',
    'a0000000-0000-0000-0000-000000000004',
    ((CURRENT_DATE - 1)::timestamp + time '08:10:00') AT TIME ZONE 'America/Caracas'
  );

-- ─── 4. Manual inventory entries / restocks ─────────────────────────────────

INSERT INTO public.inventory_movements (
  id,
  type,
  product_id,
  quantity,
  user_id,
  date,
  time,
  created_at,
  stock_before,
  price_usd
) VALUES
  ('11111111-0000-0000-0000-000000000012', 'entry', 'b0000000-0000-0000-0000-000000000009', 4, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 2, '08:40:00', ((CURRENT_DATE - 2)::timestamp + time '08:40:00') AT TIME ZONE 'America/Caracas', 15, 33.00),
  ('11111111-0000-0000-0000-000000000013', 'entry', 'b0000000-0000-0000-0000-000000000011', 5, 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 1, '10:05:00', ((CURRENT_DATE - 1)::timestamp + time '10:05:00') AT TIME ZONE 'America/Caracas', 0, 31.00);

-- ─── 4. Sale transactions ───────────────────────────────────────────────────

INSERT INTO public.transactions (
  id,
  product_id,
  quantity,
  price_usd,
  price_ves,
  exchange_rate,
  user_id,
  date,
  time,
  created_at
) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 2, 45.00, 3870.00, 86.00, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 3, '09:15:00', ((CURRENT_DATE - 3)::timestamp + time '09:15:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 1, 56.00, 4816.00, 86.00, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 3, '10:20:00', ((CURRENT_DATE - 3)::timestamp + time '10:20:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 2, 37.00, 3182.00, 86.00, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 3, '11:40:00', ((CURRENT_DATE - 3)::timestamp + time '11:40:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000010', 1, 29.00, 2494.00, 86.00, 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 3, '15:10:00', ((CURRENT_DATE - 3)::timestamp + time '15:10:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 2, 39.00, 3354.00, 86.00, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 2, '09:05:00', ((CURRENT_DATE - 2)::timestamp + time '09:05:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 1, 43.00, 3698.00, 86.00, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 2, '10:50:00', ((CURRENT_DATE - 2)::timestamp + time '10:50:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000005', 1, 49.00, 4214.00, 86.00, 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 2, '12:20:00', ((CURRENT_DATE - 2)::timestamp + time '12:20:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 1, 41.00, 3526.00, 86.00, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 2, '14:10:00', ((CURRENT_DATE - 2)::timestamp + time '14:10:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 2, 33.00, 2838.00, 86.00, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 2, '16:15:00', ((CURRENT_DATE - 2)::timestamp + time '16:15:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 1, 45.00, 3870.00, 86.00, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 1, '09:25:00', ((CURRENT_DATE - 1)::timestamp + time '09:25:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000007', 1, 53.00, 4650.75, 87.75, 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 1, '11:00:00', ((CURRENT_DATE - 1)::timestamp + time '11:00:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000012', 2, 36.00, 3159.00, 87.75, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 1, '13:10:00', ((CURRENT_DATE - 1)::timestamp + time '13:10:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000003', 1, 56.00, 4914.00, 87.75, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE - 1, '16:35:00', ((CURRENT_DATE - 1)::timestamp + time '16:35:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000005', 2, 49.00, 4299.75, 87.75, 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE, '09:10:00', ((CURRENT_DATE)::timestamp + time '09:10:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000011', 1, 31.00, 2720.25, 87.75, 'a0000000-0000-0000-0000-000000000002', CURRENT_DATE, '10:40:00', ((CURRENT_DATE)::timestamp + time '10:40:00') AT TIME ZONE 'America/Caracas'),
  ('d0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000002', 1, 39.00, 3422.25, 87.75, 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE, '14:25:00', ((CURRENT_DATE)::timestamp + time '14:25:00') AT TIME ZONE 'America/Caracas');

-- Create the historical OT-42 sale through the same grouped-sale function as
-- the application. The product is deactivated only after the sale succeeds.
DO $$
DECLARE
  inactive_product_sale_id uuid;
BEGIN
  inactive_product_sale_id := public.create_sale(
    p_business_id := '10000000-0000-0000-0000-000000000001'::uuid,
    p_items := jsonb_build_array(
      jsonb_build_object(
        'product_id', 'b0000000-0000-0000-0000-000000000014',
        'quantity', 1,
        'price_usd', 61.00,
        'price_ves', 5352.75
      )
    ),
    p_exchange_rate := 87.75
  );

  UPDATE public.sales
  SET time = '15:35:00',
      created_at = (CURRENT_DATE::timestamp + time '15:35:00') AT TIME ZONE 'America/Caracas'
  WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
    AND id = inactive_product_sale_id;

  UPDATE public.transactions
  SET time = '15:35:00',
      created_at = (CURRENT_DATE::timestamp + time '15:35:00') AT TIME ZONE 'America/Caracas'
  WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
    AND sale_id = inactive_product_sale_id;

  UPDATE public.inventory_movements
  SET time = '15:35:00',
      created_at = (CURRENT_DATE::timestamp + time '15:35:00') AT TIME ZONE 'America/Caracas'
  WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
    AND product_id = 'b0000000-0000-0000-0000-000000000014'::uuid
    AND type = 'exit';
END
$$;

-- ─── 6. Product edits ───────────────────────────────────────────────────────

SELECT public.edit_product(
  p_business_id := '10000000-0000-0000-0000-000000000001'::uuid,
  p_product_id := 'b0000000-0000-0000-0000-000000000008'::uuid,
  p_price_usd  := 43.50
);

WITH target AS (
  SELECT id
  FROM public.inventory_movements
  WHERE product_id = 'b0000000-0000-0000-0000-000000000008'
    AND type = 'edit'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE public.inventory_movements
SET date = CURRENT_DATE - 1,
    time = '18:10:00',
    created_at = ((CURRENT_DATE - 1)::timestamp + time '18:10:00') AT TIME ZONE 'America/Caracas'
WHERE id IN (SELECT id FROM target);

UPDATE public.products
SET updated_at = ((CURRENT_DATE - 1)::timestamp + time '18:10:00') AT TIME ZONE 'America/Caracas'
WHERE id = 'b0000000-0000-0000-0000-000000000008';

SELECT public.edit_product(
  p_business_id := '10000000-0000-0000-0000-000000000001'::uuid,
  p_product_id  := 'b0000000-0000-0000-0000-000000000012'::uuid,
  p_description := 'Asics Gel-Contend T35 Edicion 2',
  p_price_usd   := 38.00
);

SELECT public.adjust_product_stock(
  p_business_id := '10000000-0000-0000-0000-000000000001'::uuid,
  p_product_id := 'b0000000-0000-0000-0000-000000000012'::uuid,
  p_expected_stock := (
    SELECT stock
    FROM public.products
    WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
      AND id = 'b0000000-0000-0000-0000-000000000012'::uuid
  ),
  p_new_stock := 10,
  p_reason := 'Conteo físico de apertura'
);

WITH target AS (
  SELECT id
  FROM public.inventory_movements
  WHERE product_id = 'b0000000-0000-0000-0000-000000000012'
    AND type = 'edit'
  ORDER BY created_at DESC
  LIMIT 2
)
UPDATE public.inventory_movements
SET date = CURRENT_DATE,
    time = '08:45:00',
    created_at = ((CURRENT_DATE)::timestamp + time '08:45:00') AT TIME ZONE 'America/Caracas'
WHERE id IN (SELECT id FROM target);

UPDATE public.products
SET updated_at = ((CURRENT_DATE)::timestamp + time '08:45:00') AT TIME ZONE 'America/Caracas'
WHERE id = 'b0000000-0000-0000-0000-000000000012';

-- Preserve the real sale line while leaving its product inactive, so historical
-- sales can be checked without depending on the current inventory filter.
SELECT public.set_product_active(
  p_business_id := '10000000-0000-0000-0000-000000000001'::uuid,
  p_product_id := 'b0000000-0000-0000-0000-000000000014'::uuid,
  p_active := false
);

WITH target AS (
  SELECT id
  FROM public.inventory_movements
  WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
    AND product_id = 'b0000000-0000-0000-0000-000000000014'::uuid
    AND type = 'deactivation'
  ORDER BY created_at DESC, id DESC
  LIMIT 1
)
UPDATE public.inventory_movements
SET date = CURRENT_DATE,
    time = '16:00:00',
    created_at = ((CURRENT_DATE)::timestamp + time '16:00:00') AT TIME ZONE 'America/Caracas'
WHERE id IN (SELECT id FROM target);

UPDATE public.products
SET updated_at = ((CURRENT_DATE)::timestamp + time '16:00:00') AT TIME ZONE 'America/Caracas'
WHERE business_id = '10000000-0000-0000-0000-000000000001'::uuid
  AND id = 'b0000000-0000-0000-0000-000000000014'::uuid;

-- ─── 7. Returns and exchanges ───────────────────────────────────────────────

SELECT public.process_return(
  p_business_id   := '10000000-0000-0000-0000-000000000001'::uuid,
  p_type           := 'exchange',
  p_returned_items := '[{"product_id":"b0000000-0000-0000-0000-000000000001","quantity":1,"price_usd":45.00,"price_ves":3870.00}]'::jsonb,
  p_new_items      := '[{"product_id":"b0000000-0000-0000-0000-000000000003","quantity":1,"price_usd":56.00,"price_ves":4816.00}]'::jsonb,
  p_exchange_rate  := 86.00,
  p_notes          := 'Cambio talla cliente runner'
);

UPDATE public.returns
SET date = CURRENT_DATE - 2,
    time = '17:10:00',
    created_at = ((CURRENT_DATE - 2)::timestamp + time '17:10:00') AT TIME ZONE 'America/Caracas'
WHERE notes = 'Cambio talla cliente runner';

UPDATE public.transactions
SET date = CURRENT_DATE - 2,
    time = '17:10:00',
    created_at = ((CURRENT_DATE - 2)::timestamp + time '17:10:00') AT TIME ZONE 'America/Caracas'
WHERE return_id = (
  SELECT id FROM public.returns WHERE notes = 'Cambio talla cliente runner'
);

UPDATE public.inventory_movements
SET date = CURRENT_DATE - 2,
    time = '17:10:00',
    created_at = ((CURRENT_DATE - 2)::timestamp + time '17:10:00') AT TIME ZONE 'America/Caracas'
WHERE return_id = (
  SELECT id FROM public.returns WHERE notes = 'Cambio talla cliente runner'
);

SELECT public.process_return(
  p_business_id   := '10000000-0000-0000-0000-000000000001'::uuid,
  p_type           := 'refund',
  p_returned_items := '[{"product_id":"b0000000-0000-0000-0000-000000000009","quantity":1,"price_usd":33.00,"price_ves":2895.75}]'::jsonb,
  p_new_items      := NULL,
  p_exchange_rate  := 87.75,
  p_notes          := 'Reintegro por defecto de fabrica'
);

UPDATE public.returns
SET date = CURRENT_DATE - 1,
    time = '17:40:00',
    created_at = ((CURRENT_DATE - 1)::timestamp + time '17:40:00') AT TIME ZONE 'America/Caracas'
WHERE notes = 'Reintegro por defecto de fabrica';

UPDATE public.inventory_movements
SET date = CURRENT_DATE - 1,
    time = '17:40:00',
    created_at = ((CURRENT_DATE - 1)::timestamp + time '17:40:00') AT TIME ZONE 'America/Caracas'
WHERE return_id = (
  SELECT id FROM public.returns WHERE notes = 'Reintegro por defecto de fabrica'
);

SELECT public.process_return(
  p_business_id   := '10000000-0000-0000-0000-000000000001'::uuid,
  p_type           := 'exchange',
  p_returned_items := '[{"product_id":"b0000000-0000-0000-0000-000000000007","quantity":1,"price_usd":53.00,"price_ves":4650.75}]'::jsonb,
  p_new_items      := '[{"product_id":"b0000000-0000-0000-0000-000000000011","quantity":1,"price_usd":31.00,"price_ves":2720.25}]'::jsonb,
  p_exchange_rate  := 87.75,
  p_notes          := 'Cambio administrado con saldo a favor'
);

UPDATE public.returns
SET date = CURRENT_DATE,
    time = '12:45:00',
    created_at = ((CURRENT_DATE)::timestamp + time '12:45:00') AT TIME ZONE 'America/Caracas'
WHERE notes = 'Cambio administrado con saldo a favor';

UPDATE public.transactions
SET date = CURRENT_DATE,
    time = '12:45:00',
    created_at = ((CURRENT_DATE)::timestamp + time '12:45:00') AT TIME ZONE 'America/Caracas'
WHERE return_id = (
  SELECT id FROM public.returns WHERE notes = 'Cambio administrado con saldo a favor'
);

UPDATE public.inventory_movements
SET date = CURRENT_DATE,
    time = '12:45:00',
    created_at = ((CURRENT_DATE)::timestamp + time '12:45:00') AT TIME ZONE 'America/Caracas'
WHERE return_id = (
  SELECT id FROM public.returns WHERE notes = 'Cambio administrado con saldo a favor'
);

-- ─── 8. Historical cash closes ──────────────────────────────────────────────

INSERT INTO public.cash_closes (
  id,
  business_id,
  date,
  total_transactions,
  total_billed_operations,
  total_units_sold,
  total_usd,
  total_ves,
  exchange_rate,
  closed_by,
  closed_at,
  total_returns,
  total_returns_usd,
  total_returns_ves
)
SELECT
  seed.id,
  '10000000-0000-0000-0000-000000000001'::uuid,
  seed.close_date,
  COALESCE((
    SELECT count(*)
    FROM public.transactions t
    WHERE t.business_id = '10000000-0000-0000-0000-000000000001'
      AND t.date = seed.close_date
  ), 0),
  NULL::integer,
  COALESCE((
    SELECT sum(quantity)
    FROM public.transactions t
    WHERE t.business_id = '10000000-0000-0000-0000-000000000001'
      AND t.date = seed.close_date
  ), 0),
  COALESCE((
    SELECT sum(total_usd)
    FROM public.transactions t
    WHERE t.business_id = '10000000-0000-0000-0000-000000000001'
      AND t.date = seed.close_date
  ), 0)
    - COALESCE((
      SELECT sum(credit_usd)
      FROM public.returns r
      WHERE r.business_id = '10000000-0000-0000-0000-000000000001'
        AND r.date = seed.close_date
    ), 0),
  COALESCE((
    SELECT sum(total_ves)
    FROM public.transactions t
    WHERE t.business_id = '10000000-0000-0000-0000-000000000001'
      AND t.date = seed.close_date
  ), 0)
    - COALESCE((
      SELECT sum(credit_ves)
      FROM public.returns r
      WHERE r.business_id = '10000000-0000-0000-0000-000000000001'
        AND r.date = seed.close_date
    ), 0),
  COALESCE((
    SELECT er.rate
    FROM public.exchange_rates er
    WHERE er.business_id = '10000000-0000-0000-0000-000000000001'
      AND er.updated_at <= seed.closed_at
    ORDER BY er.updated_at DESC
    LIMIT 1
  ), 0),
  'a0000000-0000-0000-0000-000000000001',
  seed.closed_at,
  COALESCE((
    SELECT count(*)
    FROM public.returns r
    WHERE r.business_id = '10000000-0000-0000-0000-000000000001'
      AND r.date = seed.close_date
  ), 0),
  COALESCE((
    SELECT sum(credit_usd)
    FROM public.returns r
    WHERE r.business_id = '10000000-0000-0000-0000-000000000001'
      AND r.date = seed.close_date
  ), 0),
  COALESCE((
    SELECT sum(credit_ves)
    FROM public.returns r
    WHERE r.business_id = '10000000-0000-0000-0000-000000000001'
      AND r.date = seed.close_date
  ), 0)
FROM (
  VALUES
    ('e0000000-0000-0000-0000-000000000001'::uuid, CURRENT_DATE - 3, ((CURRENT_DATE - 3)::timestamp + time '18:30:00') AT TIME ZONE 'America/Caracas'),
    ('e0000000-0000-0000-0000-000000000002'::uuid, CURRENT_DATE - 2, ((CURRENT_DATE - 2)::timestamp + time '18:30:00') AT TIME ZONE 'America/Caracas'),
    ('e0000000-0000-0000-0000-000000000003'::uuid, CURRENT_DATE - 1, ((CURRENT_DATE - 1)::timestamp + time '18:30:00') AT TIME ZONE 'America/Caracas')
) AS seed(id, close_date, closed_at)
ON CONFLICT (business_id, date) DO UPDATE SET
  total_transactions = EXCLUDED.total_transactions,
  total_billed_operations = NULL,
  total_units_sold = EXCLUDED.total_units_sold,
  total_usd = EXCLUDED.total_usd,
  total_ves = EXCLUDED.total_ves,
  exchange_rate = EXCLUDED.exchange_rate,
  closed_by = EXCLUDED.closed_by,
  closed_at = EXCLUDED.closed_at,
  total_returns = EXCLUDED.total_returns,
  total_returns_usd = EXCLUDED.total_returns_usd,
  total_returns_ves = EXCLUDED.total_returns_ves;

-- ─── 9. Zapatería Estilos isolated dataset ──────────────────────────────────

SELECT set_config('app.suppress_log_entry', 'false', true);

SELECT set_config(
  'request.jwt.claim.sub',
  'a0000000-0000-0000-0000-000000000004',
  true
);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);

INSERT INTO public.products (
  id,
  business_id,
  code,
  description,
  stock,
  price_usd,
  active,
  created_at,
  updated_at
) VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'NK-39',
    'Nike Air Max 90 T39 - Estilos',
    8,
    47.00,
    true,
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'EST-40',
    'Mocasín clásico T40',
    5,
    42.00,
    true,
    now() - interval '1 day',
    now() - interval '1 day'
  );

INSERT INTO public.exchange_rates (
  id,
  business_id,
  rate,
  source,
  updated_by,
  updated_at
) VALUES (
  'f1000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  88.25,
  'manual',
  'a0000000-0000-0000-0000-000000000004',
  ((CURRENT_DATE)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas'
);

-- Una Venta confirmada con dos Renglones queda en el día anterior. Así
-- Estilos conserva actividad histórica, mientras Dashboard ejercita hoy su
-- estado vacío y Full conserva actividad actual.
DO $$
DECLARE
  estilos_sale_id uuid;
BEGIN
  estilos_sale_id := public.create_sale(
    p_business_id := '10000000-0000-0000-0000-000000000002'::uuid,
    p_items := jsonb_build_array(
      jsonb_build_object(
        'product_id', 'b1000000-0000-0000-0000-000000000001',
        'quantity', 1,
        'price_usd', 47.00,
        'price_ves', 4147.75
      ),
      jsonb_build_object(
        'product_id', 'b1000000-0000-0000-0000-000000000002',
        'quantity', 1,
        'price_usd', 42.00,
        'price_ves', 3706.50
      )
    ),
    p_exchange_rate := 88.25
  );

  UPDATE public.sales
  SET date = CURRENT_DATE - 1,
      time = '16:00:00',
      created_at = ((CURRENT_DATE - 1)::timestamp + time '16:00:00') AT TIME ZONE 'America/Caracas'
  WHERE business_id = '10000000-0000-0000-0000-000000000002'::uuid
    AND id = estilos_sale_id;

  UPDATE public.transactions
  SET date = CURRENT_DATE - 1,
      time = '16:00:00',
      created_at = ((CURRENT_DATE - 1)::timestamp + time '16:00:00') AT TIME ZONE 'America/Caracas'
  WHERE business_id = '10000000-0000-0000-0000-000000000002'::uuid
    AND sale_id = estilos_sale_id;

  UPDATE public.inventory_movements
  SET date = CURRENT_DATE - 1,
      time = '16:00:00',
      created_at = ((CURRENT_DATE - 1)::timestamp + time '16:00:00') AT TIME ZONE 'America/Caracas'
  WHERE business_id = '10000000-0000-0000-0000-000000000002'::uuid
    AND type = 'exit';
END
$$;

SELECT public.generate_daily_cash_close(
  p_business_id := '10000000-0000-0000-0000-000000000002'::uuid
);

-- ─── 10. Ventas Cashea ──────────────────────────────────────────────────────
-- Cada negocio tiene una Orden Cashea Pendiente y otra Cobrada por un Depósito
-- Cashea. Las Ventas se crean con create_cashea_sale y después se mueven a su
-- fecha, igual que las Ventas anteriores.

CREATE FUNCTION pg_temp.seed_cashea_sale(
  p_business_id uuid,
  p_actor_id uuid,
  p_items jsonb,
  p_exchange_rate numeric,
  p_cashea jsonb,
  p_date date,
  p_time time
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id uuid;
  v_created_date date;
  v_created_time time;
  v_created_at timestamptz := (p_date::timestamp + p_time) AT TIME ZONE 'America/Caracas';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated')::text,
    true
  );

  v_sale_id := public.create_cashea_sale(p_business_id, p_items, p_exchange_rate, p_cashea);

  SELECT date, time
  INTO v_created_date, v_created_time
  FROM public.sales
  WHERE business_id = p_business_id
    AND id = v_sale_id;

  UPDATE public.inventory_movements
  SET date = p_date, time = p_time, created_at = v_created_at
  WHERE business_id = p_business_id
    AND type = 'exit'
    AND date = v_created_date
    AND time = v_created_time
    AND product_id IN (
      SELECT product_id
      FROM public.transactions
      WHERE business_id = p_business_id
        AND sale_id = v_sale_id
    );

  UPDATE public.sales
  SET date = p_date, time = p_time, created_at = v_created_at
  WHERE business_id = p_business_id
    AND id = v_sale_id;

  UPDATE public.transactions
  SET date = p_date, time = p_time, created_at = v_created_at
  WHERE business_id = p_business_id
    AND sale_id = v_sale_id;

  UPDATE public.cashea_orders
  SET sale_date = p_date, created_at = v_created_at
  WHERE business_id = p_business_id
    AND sale_id = v_sale_id;

  RETURN v_sale_id;
END
$$;

CREATE FUNCTION pg_temp.seed_cashea_deposit(
  p_business_id uuid,
  p_order_number text,
  p_received_ves numeric,
  p_applied_rate numeric,
  p_deposit_date date,
  p_reference text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_order public.cashea_orders%ROWTYPE;
  v_deposit_id uuid;
  v_collected_at timestamptz := (p_deposit_date::timestamp + time '17:00:00') AT TIME ZONE 'America/Caracas';
BEGIN
  SELECT *
  INTO v_order
  FROM public.cashea_orders
  WHERE business_id = p_business_id
    AND order_number = p_order_number
    AND status = 'pending';

  INSERT INTO public.cashea_deposits (
    business_id,
    deposit_date,
    received_ves,
    applied_rate,
    expected_net_usd,
    implied_rate,
    difference_usd,
    reference,
    created_by,
    created_at
  )
  VALUES (
    p_business_id,
    p_deposit_date,
    p_received_ves,
    p_applied_rate,
    v_order.expected_net_usd,
    CASE WHEN v_order.expected_net_usd > 0 THEN round(p_received_ves / v_order.expected_net_usd, 4) END,
    v_order.expected_net_usd - round(p_received_ves / p_applied_rate, 2),
    p_reference,
    'a0000000-0000-0000-0000-000000000001',
    v_collected_at
  )
  RETURNING id INTO v_deposit_id;

  UPDATE public.cashea_orders
  SET status = 'collected',
      deposit_id = v_deposit_id,
      collected_at = v_collected_at
  WHERE business_id = p_business_id
    AND id = v_order.id;
END
$$;

-- Full Calzado: Cobrada (venta de hace 4 días) y Pendiente (venta de hoy).
SELECT pg_temp.seed_cashea_sale(
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  '[{"product_id":"b0000000-0000-0000-0000-000000000006","quantity":2,"price_usd":37.00,"price_ves":3111.70}]'::jsonb,
  84.10,
  '{"order_number":"6400612","invoice_number":"551-000701","total_usd":74.00,"paid_today_usd":37.00,"financed_usd":37.00}'::jsonb,
  CURRENT_DATE - 4,
  '11:20:00'
);

SELECT pg_temp.seed_cashea_deposit(
  '10000000-0000-0000-0000-000000000001',
  '6400612',
  2800.00,
  87.75,
  CURRENT_DATE - 1,
  'DEP-CASHEA-0001'
);

SELECT pg_temp.seed_cashea_sale(
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  '[{"product_id":"b0000000-0000-0000-0000-000000000004","quantity":1,"price_usd":43.00,"price_ves":3773.25}]'::jsonb,
  87.75,
  '{"order_number":"6400685","invoice_number":"551-000738","total_usd":43.00,"paid_today_usd":21.50,"financed_usd":21.50}'::jsonb,
  CURRENT_DATE,
  '12:15:00'
);

-- Zapatería Estilos: Cobrada (hace 3 días) y Pendiente (hace 2 días). Hoy
-- conserva su estado vacío.
SELECT pg_temp.seed_cashea_sale(
  '10000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000004',
  '[{"product_id":"b1000000-0000-0000-0000-000000000002","quantity":1,"price_usd":42.00,"price_ves":3706.50}]'::jsonb,
  88.25,
  '{"order_number":"7300114","invoice_number":"EST-000114","total_usd":42.00,"paid_today_usd":12.00,"financed_usd":30.00}'::jsonb,
  CURRENT_DATE - 3,
  '10:45:00'
);

SELECT pg_temp.seed_cashea_deposit(
  '10000000-0000-0000-0000-000000000002',
  '7300114',
  2350.00,
  88.25,
  CURRENT_DATE - 1,
  'DEP-CASHEA-0002'
);

SELECT pg_temp.seed_cashea_sale(
  '10000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000004',
  '[{"product_id":"b1000000-0000-0000-0000-000000000001","quantity":1,"price_usd":47.00,"price_ves":4147.75}]'::jsonb,
  88.25,
  '{"order_number":"7300131","invoice_number":"EST-000131","total_usd":47.00,"paid_today_usd":17.00,"financed_usd":30.00}'::jsonb,
  CURRENT_DATE - 2,
  '15:30:00'
);

-- ─── 11. Historial ampliado (hace 40 a 1 días) ──────────────────────────────
-- Más de un mes de operación en ambos negocios. Todo se crea con las mismas
-- RPC que usa la aplicación y después se mueve a su fecha; ninguna fila cae en
-- el día de hoy. Cubre:
--   - productos agotados, con poca existencia, estancados (más de 30 días sin
--     venta), desactivados con existencia y desactivados y reactivados
--   - entradas de producto nuevo y de reposición, edición de precio y
--     descripción, y ajuste de existencia
--   - ventas de uno y de varios Renglones, con precio negociado, hechas por
--     varios usuarios, incluido un ex empleado que hoy está inactivo
--   - reintegros, y cambios con diferencia a pagar y con saldo a favor
--   - Órdenes Cashea pendientes, cobradas, ajustadas dos veces, asociadas a
--     una venta existente, anuladas por error de registro y por devolución del
--     cliente (el mismo día y un día posterior), 100 % financiadas y con una
--     Comisión Cashea distinta a la vigente
--   - Depósitos Cashea de una y de varias órdenes, con y sin tasa aplicada,
--     con diferencia a favor, en contra y exacta, y uno revertido que después
--     se vuelve a cobrar
--   - historial de tasas BCV y manuales, y cierres de caja diarios con el
--     desglose Cashea (Full no cierra el día 19 a propósito)

-- Las RPC fechan todo con now(), que es fijo durante la transacción. Las filas
-- que ya tienen esa marca no pertenecen a esta sección y no se mueven.
CREATE TEMP TABLE seed_preexisting_now_rows ON COMMIT DROP AS
SELECT 'inventory_movements'::text AS table_name, id FROM public.inventory_movements WHERE created_at = now()
UNION ALL
SELECT 'sales', id FROM public.sales WHERE created_at = now()
UNION ALL
SELECT 'transactions', id FROM public.transactions WHERE created_at = now()
UNION ALL
SELECT 'returns', id FROM public.returns WHERE created_at = now();

CREATE FUNCTION pg_temp.seed_as(p_actor_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated')::text,
    true
  );
END
$$;

-- Mueve a p_date/p_time todo lo que la última RPC dejó fechado con now().
CREATE FUNCTION pg_temp.seed_backdate(p_date date, p_time time)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_at timestamptz := (p_date::timestamp + p_time) AT TIME ZONE 'America/Caracas';
BEGIN
  UPDATE public.sales
  SET date = p_date, time = p_time, created_at = v_at
  WHERE created_at = now()
    AND id NOT IN (SELECT id FROM seed_preexisting_now_rows WHERE table_name = 'sales');

  UPDATE public.transactions
  SET date = p_date, time = p_time, created_at = v_at
  WHERE created_at = now()
    AND id NOT IN (SELECT id FROM seed_preexisting_now_rows WHERE table_name = 'transactions');

  UPDATE public.returns
  SET date = p_date, time = p_time, created_at = v_at
  WHERE created_at = now()
    AND id NOT IN (SELECT id FROM seed_preexisting_now_rows WHERE table_name = 'returns');

  UPDATE public.inventory_movements
  SET date = p_date, time = p_time, created_at = v_at
  WHERE created_at = now()
    AND id NOT IN (SELECT id FROM seed_preexisting_now_rows WHERE table_name = 'inventory_movements');

  -- La orden conserva la fecha de su Venta: al asociarla a una venta de otro
  -- día, sale_date no es el día de la asociación.
  UPDATE public.cashea_orders o
  SET created_at = v_at, sale_date = s.date
  FROM public.sales s
  WHERE o.created_at = now()
    AND s.business_id = o.business_id
    AND s.id = o.sale_id;

  UPDATE public.cashea_orders SET voided_at = v_at WHERE voided_at = now();
  UPDATE public.cashea_orders SET collected_at = v_at WHERE collected_at = now();
  UPDATE public.cashea_deposits SET created_at = v_at WHERE created_at = now();
  UPDATE public.cashea_deposits SET reverted_at = v_at WHERE reverted_at = now();
  UPDATE public.cashea_order_adjustments SET created_at = v_at WHERE created_at = now();
  UPDATE public.app_settings SET updated_at = v_at WHERE updated_at = now();

  UPDATE public.products
  SET updated_at = v_at
  WHERE updated_at = now()
    AND (id::text LIKE 'b2000000-%' OR id::text LIKE 'b3000000-%');
END
$$;

CREATE FUNCTION pg_temp.seed_rate(p_business_id uuid, p_date date, p_time time)
RETURNS numeric
LANGUAGE sql
AS $$
  SELECT er.rate
  FROM public.exchange_rates er
  WHERE er.business_id = p_business_id
    AND er.updated_at <= (p_date::timestamp + p_time) AT TIME ZONE 'America/Caracas'
  ORDER BY er.updated_at DESC
  LIMIT 1
$$;

-- Convierte [{"code","quantity","price_usd"?}] en Renglones con el precio del
-- producto (o el negociado) y su equivalente en Bs. a la tasa indicada.
CREATE FUNCTION pg_temp.seed_items(p_business_id uuid, p_items jsonb, p_rate numeric)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_items jsonb;
BEGIN
  IF p_items IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'product_id', product.id,
      'quantity', (line.item->>'quantity')::integer,
      'price_usd', coalesce((line.item->>'price_usd')::numeric, product.price_usd),
      'price_ves', round(coalesce((line.item->>'price_usd')::numeric, product.price_usd) * p_rate, 2)
    )
    ORDER BY line.item_order
  )
  INTO v_items
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS line(item, item_order)
  JOIN public.products product
    ON product.business_id = p_business_id
   AND product.code = line.item->>'code';

  IF coalesce(jsonb_array_length(v_items), 0) <> jsonb_array_length(p_items) THEN
    RAISE EXCEPTION 'Seed: algún código no existe en el negocio: %', p_items;
  END IF;

  RETURN v_items;
END
$$;

-- Completa la Orden Cashea: el total es el de la Venta y lo financiado es el
-- total menos la Inicial.
CREATE FUNCTION pg_temp.seed_cashea_payload(p_cashea jsonb, p_sale_total numeric)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT p_cashea || jsonb_build_object(
    'total_usd', p_sale_total,
    'financed_usd', p_sale_total - (p_cashea->>'paid_today_usd')::numeric
  )
$$;

CREATE FUNCTION pg_temp.seed_product(
  p_business_id uuid,
  p_actor_id uuid,
  p_id uuid,
  p_code text,
  p_description text,
  p_price_usd numeric,
  p_initial_stock integer,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_at timestamptz := (p_date::timestamp + p_time) AT TIME ZONE 'America/Caracas';
BEGIN
  PERFORM pg_temp.seed_as(p_actor_id);

  -- La existencia inicial genera la entrada automática de producto nuevo.
  INSERT INTO public.products (id, business_id, code, description, stock, price_usd, active, created_at, updated_at)
  VALUES (p_id, p_business_id, p_code, p_description, p_initial_stock, p_price_usd, true, v_at, v_at);

  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_entry(
  p_business_id uuid,
  p_actor_id uuid,
  p_code text,
  p_quantity integer,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as(p_actor_id);

  INSERT INTO public.inventory_movements (business_id, type, product_id, quantity, user_id, date, time, created_at)
  SELECT
    p_business_id,
    'entry',
    product.id,
    p_quantity,
    p_actor_id,
    p_date,
    p_time,
    (p_date::timestamp + p_time) AT TIME ZONE 'America/Caracas'
  FROM public.products product
  WHERE product.business_id = p_business_id
    AND product.code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seed: producto % inexistente', p_code;
  END IF;

  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_product_id(p_business_id uuid, p_code text)
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT id FROM public.products WHERE business_id = p_business_id AND code = p_code
$$;

CREATE FUNCTION pg_temp.seed_edit_product(
  p_business_id uuid,
  p_code text,
  p_description text,
  p_price_usd numeric,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.edit_product(
    p_business_id := p_business_id,
    p_product_id := pg_temp.seed_product_id(p_business_id, p_code),
    p_description := p_description,
    p_price_usd := p_price_usd
  );
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_adjust_stock(
  p_business_id uuid,
  p_code text,
  p_new_stock integer,
  p_reason text,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.adjust_product_stock(
    p_business_id := p_business_id,
    p_product_id := pg_temp.seed_product_id(p_business_id, p_code),
    p_expected_stock := (SELECT stock FROM public.products WHERE business_id = p_business_id AND code = p_code),
    p_new_stock := p_new_stock,
    p_reason := p_reason
  );
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_set_active(
  p_business_id uuid,
  p_code text,
  p_active boolean,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.set_product_active(p_business_id, pg_temp.seed_product_id(p_business_id, p_code), p_active);
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

-- Venta normal o, con p_cashea, Venta Cashea.
CREATE FUNCTION pg_temp.seed_sale(
  p_business_id uuid,
  p_actor_id uuid,
  p_items jsonb,
  p_date date,
  p_time time,
  p_cashea jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_rate numeric := pg_temp.seed_rate(p_business_id, p_date, p_time);
  v_items jsonb := pg_temp.seed_items(p_business_id, p_items, v_rate);
  v_total numeric;
BEGIN
  PERFORM pg_temp.seed_as(p_actor_id);

  IF p_cashea IS NULL THEN
    PERFORM public.create_sale(p_business_id, v_items, v_rate);
  ELSE
    SELECT sum((item->>'price_usd')::numeric * (item->>'quantity')::integer)
    INTO v_total
    FROM jsonb_array_elements(v_items) item;

    PERFORM public.create_cashea_sale(p_business_id, v_items, v_rate, pg_temp.seed_cashea_payload(p_cashea, v_total));
  END IF;

  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

-- Solo un administrador procesa devoluciones.
CREATE FUNCTION pg_temp.seed_return(
  p_business_id uuid,
  p_type text,
  p_returned_items jsonb,
  p_new_items jsonb,
  p_notes text,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_rate numeric := pg_temp.seed_rate(p_business_id, p_date, p_time);
BEGIN
  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.process_return(
    p_business_id,
    p_type,
    pg_temp.seed_items(p_business_id, p_returned_items, v_rate),
    pg_temp.seed_items(p_business_id, p_new_items, v_rate),
    v_rate,
    p_notes
  );
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

-- Prefiere la orden activa: un número anulado puede volver a usarse.
CREATE FUNCTION pg_temp.seed_order_id(p_business_id uuid, p_order_number text)
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT id
  FROM public.cashea_orders
  WHERE business_id = p_business_id
    AND order_number = p_order_number
  ORDER BY status = 'voided', created_at DESC
  LIMIT 1
$$;

CREATE FUNCTION pg_temp.seed_attach_order(
  p_business_id uuid,
  p_sale_date date,
  p_sale_time time,
  p_cashea jsonb,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id uuid;
  v_total numeric;
BEGIN
  SELECT id INTO STRICT v_sale_id
  FROM public.sales
  WHERE business_id = p_business_id
    AND date = p_sale_date
    AND time = p_sale_time;

  SELECT sum(total_usd) INTO v_total
  FROM public.transactions
  WHERE business_id = p_business_id
    AND sale_id = v_sale_id;

  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.attach_cashea_order(p_business_id, v_sale_id, pg_temp.seed_cashea_payload(p_cashea, v_total));
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_void_order(
  p_business_id uuid,
  p_order_number text,
  p_reason public.cashea_void_reason,
  p_note text,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.void_cashea_order(p_business_id, pg_temp.seed_order_id(p_business_id, p_order_number), p_reason, p_note);
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

-- Ajusta números y la Inicial; el total se mantiene.
CREATE FUNCTION pg_temp.seed_adjust_order(
  p_business_id uuid,
  p_order_number text,
  p_new_order_number text,
  p_new_invoice_number text,
  p_paid_today_usd numeric,
  p_note text,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_order public.cashea_orders%ROWTYPE;
BEGIN
  SELECT * INTO STRICT v_order
  FROM public.cashea_orders
  WHERE id = pg_temp.seed_order_id(p_business_id, p_order_number);

  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.adjust_cashea_order(
    p_business_id,
    v_order.id,
    p_new_order_number,
    p_new_invoice_number,
    v_order.total_usd,
    p_paid_today_usd,
    v_order.total_usd - p_paid_today_usd,
    p_note
  );
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_deposit(
  p_business_id uuid,
  p_order_numbers text[],
  p_received_ves numeric,
  p_applied_rate numeric,
  p_reference text,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.register_cashea_deposit(
    p_business_id,
    ARRAY(SELECT pg_temp.seed_order_id(p_business_id, order_number) FROM unnest(p_order_numbers) AS order_number),
    p_received_ves,
    p_date,
    p_applied_rate,
    p_reference
  );
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_revert_deposit(
  p_business_id uuid,
  p_reference text,
  p_note text,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_deposit_id uuid;
BEGIN
  SELECT id INTO STRICT v_deposit_id
  FROM public.cashea_deposits
  WHERE business_id = p_business_id
    AND reference = p_reference
    AND reverted_at IS NULL;

  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.revert_cashea_deposit(p_business_id, v_deposit_id, p_note);
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

CREATE FUNCTION pg_temp.seed_cashea_settings(
  p_business_id uuid,
  p_service_fee_pct numeric,
  p_advance_fee_pct numeric,
  p_date date,
  p_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as('a0000000-0000-0000-0000-000000000001');
  PERFORM public.update_cashea_settings(p_business_id, p_service_fee_pct, p_advance_fee_pct, false);
  PERFORM pg_temp.seed_backdate(p_date, p_time);
END
$$;

-- Cierre de caja de un día pasado, con el mismo resumen que
-- generate_daily_cash_close usa para el día en curso.
CREATE FUNCTION pg_temp.seed_close(p_business_id uuid, p_actor_id uuid, p_date date, p_time time)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_temp.seed_as(p_actor_id);

  INSERT INTO public.cash_closes (
    business_id,
    date,
    total_transactions,
    total_billed_operations,
    total_units_sold,
    total_usd,
    total_ves,
    exchange_rate,
    closed_by,
    closed_at,
    total_returns,
    total_returns_usd,
    total_returns_ves,
    cashea_receivable_usd,
    cashea_receivable_ves,
    cashea_voided_return_usd,
    cashea_voided_return_ves
  )
  SELECT
    p_business_id,
    p_date,
    summary.total_transactions,
    summary.billed_operations,
    summary.total_units_sold,
    summary.net_usd,
    summary.net_ves,
    pg_temp.seed_rate(p_business_id, p_date, p_time),
    p_actor_id,
    (p_date::timestamp + p_time) AT TIME ZONE 'America/Caracas',
    summary.total_returns,
    summary.total_returns_usd,
    summary.total_returns_ves,
    summary.cashea_receivable_usd,
    summary.cashea_receivable_ves,
    summary.cashea_voided_return_usd,
    summary.cashea_voided_return_ves
  FROM private.get_cash_close_summary(p_business_id, p_date) summary;
END
$$;

-- ─── 11.1 Tasas ─────────────────────────────────────────────────────────────

INSERT INTO public.exchange_rates (id, business_id, rate, source, updated_by, updated_at) VALUES
  ('f2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 74.80, 'bcv', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 35)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas'),
  ('f2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 76.15, 'bcv', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 30)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas'),
  ('f2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 78.40, 'manual', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 25)::timestamp + time '08:30:00') AT TIME ZONE 'America/Caracas'),
  ('f2000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 79.90, 'bcv', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 21)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas'),
  ('f2000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 81.05, 'bcv', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 17)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas'),
  ('f2000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 82.30, 'manual', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 14)::timestamp + time '08:30:00') AT TIME ZONE 'America/Caracas'),
  ('f2000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 82.70, 'bcv', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 12)::timestamp + time '08:00:00') AT TIME ZONE 'America/Caracas'),
  ('f2000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 85.20, 'manual', 'a0000000-0000-0000-0000-000000000001', ((CURRENT_DATE - 5)::timestamp + time '08:30:00') AT TIME ZONE 'America/Caracas'),
  ('f3000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 75.00, 'manual', 'a0000000-0000-0000-0000-000000000004', ((CURRENT_DATE - 35)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas'),
  ('f3000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 77.50, 'manual', 'a0000000-0000-0000-0000-000000000004', ((CURRENT_DATE - 28)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas'),
  ('f3000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 80.10, 'manual', 'a0000000-0000-0000-0000-000000000004', ((CURRENT_DATE - 21)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas'),
  ('f3000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 82.60, 'bcv', 'a0000000-0000-0000-0000-000000000004', ((CURRENT_DATE - 14)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas'),
  ('f3000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 84.40, 'manual', 'a0000000-0000-0000-0000-000000000004', ((CURRENT_DATE - 7)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas'),
  ('f3000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 85.50, 'manual', 'a0000000-0000-0000-0000-000000000004', ((CURRENT_DATE - 4)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas'),
  ('f3000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 88.25, 'manual', 'a0000000-0000-0000-0000-000000000004', ((CURRENT_DATE - 3)::timestamp + time '08:15:00') AT TIME ZONE 'America/Caracas');

-- ─── 11.2 Full Calzado ──────────────────────────────────────────────────────
-- Existencia final: FL-40 6, SP-38 17, BT-41 3, MC-42 1, TC-37 5, EZ-36 2,
-- KD-28 6 (estancado), UA-43 1 (reactivado), CR-39 0 (agotado) y SL-44 3
-- (inactivo).

SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'FL-40', 'Fila Disruptor II T40', 44.00, 12, CURRENT_DATE - 40, '09:00:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'SP-38', 'Sandalia Ipanema Playa T38', 18.00, 30, CURRENT_DATE - 40, '09:05:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000003', 'BT-41', 'Bota Caterpillar Colorado T41', 89.00, 6, CURRENT_DATE - 40, '09:10:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000004', 'MC-42', 'Mocasín Hush Puppies T42', 58.00, 8, CURRENT_DATE - 40, '09:15:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000005', 'TC-37', 'Tacón Clásico Charol T37', 42.00, 10, CURRENT_DATE - 40, '09:20:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000006', 'EZ-36', 'Zapato Escolar Negro T36', 25.00, 20, CURRENT_DATE - 40, '09:25:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000007', 'KD-28', 'Zapatilla Niño Velcro T28', 22.00, 6, CURRENT_DATE - 40, '09:30:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000009', 'CR-39', 'Crocs Classic Clog T39', 35.00, 8, CURRENT_DATE - 40, '09:35:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000008', 'UA-43', 'Under Armour Charged T43', 65.00, 5, CURRENT_DATE - 38, '10:00:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000010', 'SL-44', 'Skechers Slip-ins T44', 54.00, 6, CURRENT_DATE - 38, '10:20:00');

-- Día 35
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', '[{"code":"SP-38","quantity":3}]', CURRENT_DATE - 35, '10:15:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"FL-40","quantity":1},{"code":"EZ-36","quantity":2}]', CURRENT_DATE - 35, '11:40:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"TC-37","quantity":1}]', CURRENT_DATE - 35, '16:20:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 35, '18:30:00');

-- Día 33: primera Venta Cashea y un precio negociado.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', '[{"code":"CR-39","quantity":2}]', CURRENT_DATE - 33, '09:50:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"BT-41","quantity":1}]', CURRENT_DATE - 33, '12:10:00', '{"order_number":"6400101","invoice_number":"551-000101","paid_today_usd":29.00}');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"MC-42","quantity":1,"price_usd":55.00}]', CURRENT_DATE - 33, '15:30:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 33, '18:30:00');

-- Día 30
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"SP-38","quantity":4}]', CURRENT_DATE - 30, '10:05:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', '[{"code":"FL-40","quantity":2}]', CURRENT_DATE - 30, '11:30:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"MC-42","quantity":1}]', CURRENT_DATE - 30, '14:45:00', '{"order_number":"6400134","invoice_number":"551-000134","paid_today_usd":18.00}');
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000001', 'refund', '[{"code":"TC-37","quantity":1}]', NULL, 'Reintegro talla equivocada tacón', CURRENT_DATE - 30, '17:10:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 30, '18:40:00');

-- Día 28
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', '[{"code":"EZ-36","quantity":3}]', CURRENT_DATE - 28, '10:20:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"CR-39","quantity":1},{"code":"SP-38","quantity":2}]', CURRENT_DATE - 28, '13:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"UA-43","quantity":1}]', CURRENT_DATE - 28, '16:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, '18:30:00');

-- Día 26: la orden 6400170 se registró en la venta equivocada. El
-- Administrador la anula por error de registro y la asocia a la venta correcta.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"FL-40","quantity":2}]', CURRENT_DATE - 26, '09:40:00', '{"order_number":"6400170","invoice_number":"551-000170","paid_today_usd":28.00}');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"BT-41","quantity":1}]', CURRENT_DATE - 26, '11:15:00');
SELECT pg_temp.seed_void_order('10000000-0000-0000-0000-000000000001', '6400170', 'registration_error', 'Orden registrada en la venta equivocada; corresponde a la bota de las 11:15', CURRENT_DATE - 26, '12:30:00');
SELECT pg_temp.seed_attach_order('10000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, '11:15:00', '{"order_number":"6400170","invoice_number":"551-000171","paid_today_usd":29.00}', CURRENT_DATE - 26, '12:35:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', '[{"code":"SP-38","quantity":2}]', CURRENT_DATE - 26, '15:50:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, '18:30:00');

-- Día 25: Depósito Cashea de dos órdenes, con Cashea pagando 0,20 USD menos.
SELECT pg_temp.seed_deposit('10000000-0000-0000-0000-000000000001', ARRAY['6400101', '6400134'], 7050.00, 78.40, 'DEP-CASHEA-0101', CURRENT_DATE - 25, '16:00:00');

-- Día 24: cambio con diferencia a pagar.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', '[{"code":"EZ-36","quantity":4}]', CURRENT_DATE - 24, '10:30:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"TC-37","quantity":2}]', CURRENT_DATE - 24, '12:00:00');
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000001', 'exchange', '[{"code":"SP-38","quantity":1}]', '[{"code":"FL-40","quantity":1}]', 'Cambio de sandalia por deportivo', CURRENT_DATE - 24, '17:20:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, '18:30:00');

-- Día 21: último día de Pedro.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', '[{"code":"CR-39","quantity":2}]', CURRENT_DATE - 21, '10:10:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"UA-43","quantity":1}]', CURRENT_DATE - 21, '11:45:00', '{"order_number":"6400215","invoice_number":"551-000215","paid_today_usd":25.00}');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"MC-42","quantity":2}]', CURRENT_DATE - 21, '14:20:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, '18:30:00');

-- Día 19: hubo ventas pero nadie cerró la caja.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"SP-38","quantity":5}]', CURRENT_DATE - 19, '10:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"FL-40","quantity":1}]', CURRENT_DATE - 19, '15:30:00');

-- Día 17: Depósito sin tasa aplicada (se revierte el día 12).
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"BT-41","quantity":1}]', CURRENT_DATE - 17, '09:30:00', '{"order_number":"6400288","invoice_number":"551-000288","paid_today_usd":39.00}');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"EZ-36","quantity":2},{"code":"SP-38","quantity":1},{"code":"TC-37","quantity":1}]', CURRENT_DATE - 17, '12:40:00');
SELECT pg_temp.seed_deposit('10000000-0000-0000-0000-000000000001', ARRAY['6400215'], 2900.00, NULL, 'DEP-CASHEA-0102', CURRENT_DATE - 17, '16:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, '18:30:00');

-- Día 16: primer ajuste de la orden 6400288 (sin ventas ni cierre).
SELECT pg_temp.seed_adjust_order('10000000-0000-0000-0000-000000000001', '6400288', '6400288', '551-000288', 44.00, 'El cliente pagó una inicial mayor; corregido según el panel Cashea', CURRENT_DATE - 16, '10:00:00');

-- Día 15: segundo ajuste, se agota CR-39 y llega reposición.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"CR-39","quantity":3}]', CURRENT_DATE - 15, '10:20:00');
SELECT pg_temp.seed_adjust_order('10000000-0000-0000-0000-000000000001', '6400288', '6400288', '551-000289', 44.00, 'Número de factura mal transcrito', CURRENT_DATE - 15, '11:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"FL-40","quantity":1}]', CURRENT_DATE - 15, '13:10:00');
SELECT pg_temp.seed_entry('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'SP-38', 12, CURRENT_DATE - 15, '16:00:00');
SELECT pg_temp.seed_entry('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'FL-40', 6, CURRENT_DATE - 15, '16:05:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, '18:30:00');

-- Día 14: edición de catálogo, ajuste de existencia y cambio con saldo a favor.
SELECT pg_temp.seed_edit_product('10000000-0000-0000-0000-000000000001', 'SL-44', 'Skechers Slip-ins Max Cushioning T44', 57.00, CURRENT_DATE - 14, '09:30:00');
SELECT pg_temp.seed_adjust_stock('10000000-0000-0000-0000-000000000001', 'SL-44', 5, 'Par dañado en exhibición', CURRENT_DATE - 14, '09:35:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"SL-44","quantity":1}]', CURRENT_DATE - 14, '10:40:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"MC-42","quantity":2}]', CURRENT_DATE - 14, '12:15:00', '{"order_number":"6400341","invoice_number":"551-000341","paid_today_usd":36.00}');
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000001', 'exchange', '[{"code":"MC-42","quantity":1}]', '[{"code":"SP-38","quantity":1}]', 'Cambio de mocasín por sandalia con saldo a favor', CURRENT_DATE - 14, '16:45:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, '18:30:00');

-- Día 13: UA-43 se desactiva temporalmente.
SELECT pg_temp.seed_set_active('10000000-0000-0000-0000-000000000001', 'UA-43', false, CURRENT_DATE - 13, '09:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"EZ-36","quantity":2}]', CURRENT_DATE - 13, '11:20:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"SP-38","quantity":3}]', CURRENT_DATE - 13, '15:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, '18:30:00');

-- Día 12: el banco devuelve la transferencia del depósito DEP-CASHEA-0102.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"FL-40","quantity":2}]', CURRENT_DATE - 12, '10:30:00');
SELECT pg_temp.seed_revert_deposit('10000000-0000-0000-0000-000000000001', 'DEP-CASHEA-0102', 'El banco devolvió la transferencia; Cashea la reenviará', CURRENT_DATE - 12, '11:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"TC-37","quantity":1}]', CURRENT_DATE - 12, '14:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, '18:30:00');

-- Día 11: orden que sigue Pendiente y UA-43 vuelve al catálogo.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"SP-38","quantity":2},{"code":"EZ-36","quantity":1}]', CURRENT_DATE - 11, '10:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"FL-40","quantity":1}]', CURRENT_DATE - 11, '13:30:00', '{"order_number":"6400390","invoice_number":"551-000390","paid_today_usd":14.00}');
SELECT pg_temp.seed_set_active('10000000-0000-0000-0000-000000000001', 'UA-43', true, CURRENT_DATE - 11, '16:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, '18:30:00');

-- Día 9: el cliente devuelve la bota de la orden 6400288 (venta del día 17):
-- reintegro y anulación por devolución del cliente, que el cierre compensa.
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000001', 'refund', '[{"code":"BT-41","quantity":1}]', NULL, 'Devolución de bota pagada con Cashea', CURRENT_DATE - 9, '10:15:00');
SELECT pg_temp.seed_void_order('10000000-0000-0000-0000-000000000001', '6400288', 'customer_return', 'El cliente devolvió la bota; anulada también en el panel Cashea', CURRENT_DATE - 9, '10:20:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"UA-43","quantity":1}]', CURRENT_DATE - 9, '12:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"SP-38","quantity":1}]', CURRENT_DATE - 9, '15:40:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, '18:30:00');

-- Día 8: Depósito de dos órdenes, una de ellas asociada el día 26.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"SL-44","quantity":1}]', CURRENT_DATE - 8, '10:40:00', '{"order_number":"6400433","invoice_number":"551-000433","paid_today_usd":17.00}');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"EZ-36","quantity":2}]', CURRENT_DATE - 8, '13:20:00');
SELECT pg_temp.seed_deposit('10000000-0000-0000-0000-000000000001', ARRAY['6400170', '6400341'], 10480.00, 83.25, 'DEP-CASHEA-0103', CURRENT_DATE - 8, '16:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, '18:30:00');

-- Día 6: Cashea reenvía el depósito revertido (paga 0,05 USD de más) y una
-- orden 100 % financiada.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"FL-40","quantity":1},{"code":"SP-38","quantity":2}]', CURRENT_DATE - 6, '10:10:00');
SELECT pg_temp.seed_deposit('10000000-0000-0000-0000-000000000001', ARRAY['6400215'], 3015.00, 84.10, 'DEP-CASHEA-0104', CURRENT_DATE - 6, '11:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"MC-42","quantity":1}]', CURRENT_DATE - 6, '12:50:00', '{"order_number":"6400467","invoice_number":"551-000467","paid_today_usd":0.00}');
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000001', 'refund', '[{"code":"TC-37","quantity":1}]', NULL, 'Reintegro por costura defectuosa', CURRENT_DATE - 6, '15:30:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, '18:30:00');

-- Día 5: EZ-36 queda con poca existencia.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"TC-37","quantity":2,"price_usd":40.00}]', CURRENT_DATE - 5, '09:45:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"BT-41","quantity":1}]', CURRENT_DATE - 5, '11:30:00', '{"order_number":"6400502","invoice_number":"551-000502","paid_today_usd":44.50}');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"EZ-36","quantity":2}]', CURRENT_DATE - 5, '14:10:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, '18:30:00');

-- Día 4: devolución Cashea el mismo día de la venta y SL-44 sale del catálogo
-- con existencia. El cierre incluye la Venta Cashea de la sección 10.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"UA-43","quantity":1}]', CURRENT_DATE - 4, '10:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '[{"code":"SP-38","quantity":3}]', CURRENT_DATE - 4, '11:30:00', '{"order_number":"6400544","invoice_number":"551-000544","paid_today_usd":14.00}');
SELECT pg_temp.seed_set_active('10000000-0000-0000-0000-000000000001', 'SL-44', false, CURRENT_DATE - 4, '13:00:00');
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000001', 'refund', '[{"code":"SP-38","quantity":3}]', NULL, 'El cliente devolvió las sandalias el mismo día', CURRENT_DATE - 4, '15:00:00');
SELECT pg_temp.seed_void_order('10000000-0000-0000-0000-000000000001', '6400544', 'customer_return', 'Devolución el mismo día de la venta', CURRENT_DATE - 4, '15:05:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '[{"code":"MC-42","quantity":1}]', CURRENT_DATE - 4, '16:30:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, '18:30:00');

-- Pedro dejó la tienda: conserva su historial, pero ya no entra ni tiene acceso.
DELETE FROM public.user_business_access
WHERE user_id = 'a0000000-0000-0000-0000-000000000005';

UPDATE public.users
SET is_active = false,
    updated_at = ((CURRENT_DATE - 20)::timestamp + time '09:00:00') AT TIME ZONE 'America/Caracas'
WHERE id = 'a0000000-0000-0000-0000-000000000005';

-- ─── 11.3 Zapatería Estilos ─────────────────────────────────────────────────
-- Entre los días 25 y 12 la Comisión Cashea fue de 4,5 % y 3,5 %: las órdenes
-- de ese período la conservan. Existencia final: EST-38 8, EST-41 1, EST-37 7,
-- EST-43 2 y EST-35 8 (estancado).

SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b3000000-0000-0000-0000-000000000001', 'EST-38', 'Sandalia de cuero T38', 36.00, 10, CURRENT_DATE - 36, '09:00:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b3000000-0000-0000-0000-000000000002', 'EST-41', 'Bota de trabajo T41', 72.00, 5, CURRENT_DATE - 36, '09:05:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b3000000-0000-0000-0000-000000000003', 'EST-37', 'Bailarina T37', 28.00, 6, CURRENT_DATE - 36, '09:10:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b3000000-0000-0000-0000-000000000004', 'EST-43', 'Zapato de vestir T43', 64.00, 4, CURRENT_DATE - 36, '09:15:00');
SELECT pg_temp.seed_product('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b3000000-0000-0000-0000-000000000005', 'EST-35', 'Pantufla T35', 15.00, 8, CURRENT_DATE - 36, '09:20:00');

-- Día 34
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-38","quantity":1}]', CURRENT_DATE - 34, '11:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-41","quantity":1}]', CURRENT_DATE - 34, '16:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 34, '19:00:00');

-- Día 29
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', '[{"code":"EST-37","quantity":1},{"code":"EST-38","quantity":1}]', CURRENT_DATE - 29, '10:30:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-43","quantity":1}]', CURRENT_DATE - 29, '15:00:00', '{"order_number":"7300201","invoice_number":"EST-000201","paid_today_usd":24.00}');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 29, '19:00:00');

-- Día 27
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-38","quantity":2}]', CURRENT_DATE - 27, '12:00:00');
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000002', 'refund', '[{"code":"EST-38","quantity":1}]', NULL, 'Reintegro de sandalia con defecto', CURRENT_DATE - 27, '17:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 27, '19:00:00');

-- Día 25: cambia la Comisión Cashea.
SELECT pg_temp.seed_cashea_settings('10000000-0000-0000-0000-000000000002', 4.50, 3.50, CURRENT_DATE - 25, '10:00:00');

-- Día 22: cierra Ana.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-41","quantity":1}]', CURRENT_DATE - 22, '10:00:00', '{"order_number":"7300245","invoice_number":"EST-000245","paid_today_usd":22.00}');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', '[{"code":"EST-37","quantity":2}]', CURRENT_DATE - 22, '14:30:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', CURRENT_DATE - 22, '19:00:00');

-- Día 20: Depósito de dos órdenes con comisiones distintas, sin diferencia.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-38","quantity":1}]', CURRENT_DATE - 20, '11:00:00');
SELECT pg_temp.seed_deposit('10000000-0000-0000-0000-000000000002', ARRAY['7300201', '7300245'], 6476.00, 80.10, 'EST-DEP-0201', CURRENT_DATE - 20, '16:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 20, '19:00:00');

-- Día 15: cambio con diferencia a pagar y una orden que sigue Pendiente.
SELECT pg_temp.seed_return('10000000-0000-0000-0000-000000000002', 'exchange', '[{"code":"EST-37","quantity":1}]', '[{"code":"EST-38","quantity":1}]', 'Cambio de bailarina por sandalia', CURRENT_DATE - 15, '10:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-43","quantity":1}]', CURRENT_DATE - 15, '13:00:00', '{"order_number":"7300289","invoice_number":"EST-000289","paid_today_usd":34.00}');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 15, '19:00:00');

-- Día 12: vuelve la Comisión Cashea de 4 % y 4 %.
SELECT pg_temp.seed_cashea_settings('10000000-0000-0000-0000-000000000002', 4.00, 4.00, CURRENT_DATE - 12, '09:00:00');

-- Día 9: sube el precio de EST-38. Los días 10 a 12 quedan sin actividad
-- porque cash_close_cashea.test.sql los usa para sus propios escenarios.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-41","quantity":1}]', CURRENT_DATE - 9, '11:00:00');
SELECT pg_temp.seed_edit_product('10000000-0000-0000-0000-000000000002', 'EST-38', 'Sandalia de cuero T38', 38.00, CURRENT_DATE - 9, '15:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 9, '19:00:00');

-- Día 7: la orden 7300340 no se completó en Cashea y el cliente pagó de contado.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-38","quantity":1}]', CURRENT_DATE - 7, '10:30:00', '{"order_number":"7300340","invoice_number":"EST-000340","paid_today_usd":8.00}');
SELECT pg_temp.seed_void_order('10000000-0000-0000-0000-000000000002', '7300340', 'registration_error', 'La orden no se completó en Cashea; el cliente pagó de contado', CURRENT_DATE - 7, '11:00:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', '[{"code":"EST-37","quantity":1}]', CURRENT_DATE - 7, '16:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 7, '19:00:00');

-- Día 5: número de orden mal transcrito.
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-41","quantity":1}]', CURRENT_DATE - 5, '12:00:00', '{"order_number":"7300377","invoice_number":"EST-000377","paid_today_usd":32.00}');
SELECT pg_temp.seed_adjust_order('10000000-0000-0000-0000-000000000002', '7300377', '7300378', 'EST-000377', 32.00, 'Número de orden mal transcrito', CURRENT_DATE - 5, '15:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 5, '19:00:00');

-- Día 4: reposición.
SELECT pg_temp.seed_entry('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'EST-38', 6, CURRENT_DATE - 4, '09:30:00');
SELECT pg_temp.seed_entry('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'EST-37', 4, CURRENT_DATE - 4, '09:35:00');
SELECT pg_temp.seed_sale('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', '[{"code":"EST-38","quantity":2}]', CURRENT_DATE - 4, '13:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 4, '19:00:00');

-- Días 3 a 1: cierres de la actividad de las secciones 9 y 10.
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 3, '19:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 2, '19:00:00');
SELECT pg_temp.seed_close('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', CURRENT_DATE - 1, '19:00:00');

-- Restore the production contract: every application write must provide its
-- business explicitly.
ALTER TABLE public.products ALTER COLUMN business_id DROP DEFAULT;
ALTER TABLE public.inventory_movements ALTER COLUMN business_id DROP DEFAULT;
ALTER TABLE public.transactions ALTER COLUMN business_id DROP DEFAULT;
ALTER TABLE public.returns ALTER COLUMN business_id DROP DEFAULT;
ALTER TABLE public.return_items ALTER COLUMN business_id DROP DEFAULT;
ALTER TABLE public.cash_closes ALTER COLUMN business_id DROP DEFAULT;
ALTER TABLE public.exchange_rates ALTER COLUMN business_id DROP DEFAULT;

UPDATE auth.users SET
  email_change           = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token         = COALESCE(recovery_token, ''),
  confirmation_token     = COALESCE(confirmation_token, '');

COMMIT;
