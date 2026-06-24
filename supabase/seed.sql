-- ============================================================================
-- Seed: Zapateria Inventory - Local Development Dataset
--
-- This seed is designed for local Supabase resets and manual seeding.
-- It creates deterministic data that exercises all current database flows:
--   - auth users + public.users trigger
--   - exchange rate history + app settings
--   - products in multiple states (active, inactive, zero stock)
--   - inventory entry movements (manual restock + new product auto-entry)
--   - sale transactions and generated exit movements
--   - returns: exchange with positive diff, refund, exchange with negative diff
--   - product edits: price-only and stock/price/description edit
--   - historical cash closes for previous days
--
-- Login credentials for all seeded users: password123
-- Assignments:
--   maria@tienda.com  -> admin, can access both businesses, defaults to Full
--   carlos@tienda.com -> employee, Full Calzado
--   ana@tienda.com    -> employee, Full Calzado + Zapatería Estilos, defaults to Full
--   luis@tienda.com   -> employee, Zapatería Estilos
-- ============================================================================

BEGIN;

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
OR return_id IN (
  SELECT id
  FROM public.returns
  WHERE notes IN (
    'Cambio talla cliente runner',
    'Reintegro por defecto de fabrica',
    'Cambio administrado con saldo a favor'
  )
);

DELETE FROM public.return_items
WHERE return_id IN (
  SELECT id
  FROM public.returns
  WHERE notes IN (
    'Cambio talla cliente runner',
    'Reintegro por defecto de fabrica',
    'Cambio administrado con saldo a favor'
  )
);

DELETE FROM public.returns
WHERE notes IN (
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
OR business_id = '10000000-0000-0000-0000-000000000002';

DELETE FROM public.exchange_rates
WHERE id IN (
  'f0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000003',
  'f0000000-0000-0000-0000-000000000004',
  'f1000000-0000-0000-0000-000000000001'
)
OR business_id = '10000000-0000-0000-0000-000000000002';

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
);

DELETE FROM auth.identities
WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004'
);

DELETE FROM auth.users
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004'
)
OR email IN (
  'maria@tienda.com',
  'carlos@tienda.com',
  'ana@tienda.com',
  'luis@tienda.com'
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
    now() - interval '30 days',
    now() - interval '30 days',
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
    now() - interval '24 days',
    now() - interval '24 days',
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
    now() - interval '18 days',
    now() - interval '18 days',
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
    now() - interval '12 days',
    now() - interval '12 days',
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
    now() - interval '30 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000002', 'email', 'carlos@tienda.com', 'email_verified', true),
    'email',
    now() - interval '1 day',
    now() - interval '24 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000003', 'email', 'ana@tienda.com', 'email_verified', true),
    'email',
    now() - interval '1 day',
    now() - interval '18 days',
    now() - interval '1 day'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000004', 'email', 'luis@tienda.com', 'email_verified', true),
    'email',
    now() - interval '1 day',
    now() - interval '12 days',
    now() - interval '1 day'
  );

UPDATE public.users
SET role = CASE id
    WHEN 'a0000000-0000-0000-0000-000000000001' THEN 'admin'::public.roles
    ELSE 'employee'::public.roles
  END,
  is_active = true,
  created_at = CASE id
    WHEN 'a0000000-0000-0000-0000-000000000001' THEN now() - interval '30 days'
    WHEN 'a0000000-0000-0000-0000-000000000002' THEN now() - interval '24 days'
    WHEN 'a0000000-0000-0000-0000-000000000003' THEN now() - interval '18 days'
    ELSE now() - interval '12 days'
  END,
  updated_at = now() - interval '1 day'
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004'
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
  'a0000000-0000-0000-0000-000000000004'
);

DELETE FROM public.user_business_access
WHERE user_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004'
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
  ('b0000000-0000-0000-0000-000000000009', 'SK-36', 'Skechers D-Lites T36', 0, 33.00, true, now() - interval '12 days', now() - interval '12 days'),
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
  p_price_usd   := 38.00,
  p_stock       := 10
);

WITH target AS (
  SELECT id
  FROM public.inventory_movements
  WHERE product_id = 'b0000000-0000-0000-0000-000000000012'
    AND type = 'edit'
  ORDER BY created_at DESC
  LIMIT 1
)
UPDATE public.inventory_movements
SET date = CURRENT_DATE,
    time = '08:45:00',
    created_at = ((CURRENT_DATE)::timestamp + time '08:45:00') AT TIME ZONE 'America/Caracas'
WHERE id IN (SELECT id FROM target);

UPDATE public.products
SET updated_at = ((CURRENT_DATE)::timestamp + time '08:45:00') AT TIME ZONE 'America/Caracas'
WHERE id = 'b0000000-0000-0000-0000-000000000012';

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

INSERT INTO public.transactions (
  id,
  business_id,
  product_id,
  quantity,
  price_usd,
  price_ves,
  exchange_rate,
  user_id,
  date,
  time,
  created_at
) VALUES (
  'd1000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  1,
  47.00,
  4147.75,
  88.25,
  'a0000000-0000-0000-0000-000000000004',
  CURRENT_DATE,
  '11:20:00',
  ((CURRENT_DATE)::timestamp + time '11:20:00') AT TIME ZONE 'America/Caracas'
);

SELECT public.generate_daily_cash_close(
  p_business_id := '10000000-0000-0000-0000-000000000002'::uuid
);

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
