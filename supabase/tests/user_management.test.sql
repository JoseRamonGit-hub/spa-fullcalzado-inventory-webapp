-- ============================================================================
-- TEST SUITE: user_management
-- Requires the deterministic local seed.
-- ============================================================================

BEGIN;

SELECT plan(13);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);

SELECT throws_ok(
  $$
    SELECT public.admin_update_user(
      'a0000000-0000-0000-0000-000000000004',
      'Blocked Update',
      'employee'::public.roles,
      true,
      ARRAY['10000000-0000-0000-0000-000000000002'::uuid],
      '10000000-0000-0000-0000-000000000002'::uuid
    )
  $$,
  'P0001',
  'Solo un administrador puede actualizar usuarios',
  'Employee cannot update users'
);

RESET ROLE;

INSERT INTO auth.users (
  id,
  email,
  instance_id,
  aud,
  role,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_confirmed_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000010',
  'multi.employee@tienda.com',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"fullname":"Multi Employee"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  '',
  now()
);

SELECT is(
  (
    SELECT default_business_id::text
    FROM public.users
    WHERE email = 'multi.employee@tienda.com'
  ),
  '10000000-0000-0000-0000-000000000001',
  'Auth trigger creates a public profile with fallback default business'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT throws_ok(
  $$
    SELECT public.admin_update_user(
      'b0000000-0000-0000-0000-000000000010',
      'Multi Employee',
      'employee'::public.roles,
      true,
      ARRAY['10000000-0000-0000-0000-000000000001'::uuid],
      NULL
    )
  $$,
  'P0001',
  'El negocio predeterminado es requerido',
  'Default business is required'
);

SELECT throws_ok(
  $$
    SELECT public.admin_update_user(
      'b0000000-0000-0000-0000-000000000010',
      'Multi Employee',
      'employee'::public.roles,
      true,
      ARRAY[]::uuid[],
      '10000000-0000-0000-0000-000000000001'::uuid
    )
  $$,
  'P0001',
  'Un empleado activo debe tener al menos un negocio asignado',
  'Employee requires at least one assigned business'
);

SELECT lives_ok(
  $$
    SELECT public.admin_update_user(
      'b0000000-0000-0000-0000-000000000010',
      'Multi Employee',
      'employee'::public.roles,
      true,
      ARRAY[
        '10000000-0000-0000-0000-000000000001'::uuid,
        '10000000-0000-0000-0000-000000000002'::uuid
      ],
      '10000000-0000-0000-0000-000000000002'::uuid
    )
  $$,
  'Admin can assign an employee to multiple businesses'
);

RESET ROLE;

SELECT is(
  (
    SELECT role::text
    FROM public.users
    WHERE email = 'multi.employee@tienda.com'
  ),
  'employee',
  'Managed profile has employee role'
);

SELECT ok(
  (
    SELECT is_active
    FROM public.users
    WHERE email = 'multi.employee@tienda.com'
  ),
  'Managed user is active'
);

SELECT is(
  (
    SELECT count(*)::int
    FROM public.user_business_access uba
    JOIN public.users u ON u.id = uba.user_id
    WHERE u.email = 'multi.employee@tienda.com'
  ),
  2,
  'Employee has two assigned businesses'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT lives_ok(
  $$
    SELECT public.admin_set_user_business_access(
      'b0000000-0000-0000-0000-000000000010',
      ARRAY['10000000-0000-0000-0000-000000000001'::uuid],
      '10000000-0000-0000-0000-000000000001'::uuid
    )
  $$,
  'Admin can reduce business access'
);

RESET ROLE;

SELECT is(
  (
    SELECT count(*)::int
    FROM public.user_business_access uba
    JOIN public.users u ON u.id = uba.user_id
    WHERE u.email = 'multi.employee@tienda.com'
  ),
  1,
  'Employee keeps only one assigned business'
);

SELECT set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000010', true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.businesses),
  1,
  'Active employee can read exactly the assigned business'
);

RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

SELECT lives_ok(
  $$
    SELECT public.admin_update_user(
      'b0000000-0000-0000-0000-000000000010',
      'Multi Employee Disabled',
      'employee'::public.roles,
      false,
      ARRAY['10000000-0000-0000-0000-000000000001'::uuid],
      '10000000-0000-0000-0000-000000000001'::uuid
    )
  $$,
  'Admin can deactivate users'
);

RESET ROLE;

SELECT set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000010', true);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.businesses),
  0,
  'Inactive user cannot read assigned businesses'
);

SELECT * FROM finish();

ROLLBACK;
