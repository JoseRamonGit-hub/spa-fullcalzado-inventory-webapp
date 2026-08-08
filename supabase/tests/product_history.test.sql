begin;

set local search_path = public, extensions;

select plan(7);
select set_config('app.suppress_log_entry', 'true', true);

insert into public.products (id, business_id, code, description, stock, price_usd)
values
  ('34000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'HISTORY-01', 'Historial principal', 20, 30),
  ('34000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'HISTORY-02', 'Historial aislado', 10, 20),
  ('34000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'HISTORY-03', 'Sin historial', 0, 10);

insert into public.returns (
  id, business_id, type, credit_usd, credit_ves, exchange_rate, user_id
)
values (
  '35000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'exchange',
  30,
  2700,
  90,
  'a0000000-0000-0000-0000-000000000001'
);

insert into public.inventory_movements (
  id, business_id, product_id, user_id, type, quantity, date, time, created_at, return_id, stock_before
)
values
  ('36000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'entry', 5, (now() at time zone 'America/Caracas')::date - 29, '08:00', (((now() at time zone 'America/Caracas')::date - 29)::timestamp + time '08:00') at time zone 'America/Caracas', null, 0),
  ('36000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'exit', 1, (now() at time zone 'America/Caracas')::date, '09:00', ((now() at time zone 'America/Caracas')::date::timestamp + time '09:00') at time zone 'America/Caracas', null, 20),
  ('36000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'return', 1, (now() at time zone 'America/Caracas')::date, '10:00', ((now() at time zone 'America/Caracas')::date::timestamp + time '10:00') at time zone 'America/Caracas', '35000000-0000-0000-0000-000000000001', 19),
  ('36000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'exit', 1, (now() at time zone 'America/Caracas')::date, '11:00', ((now() at time zone 'America/Caracas')::date::timestamp + time '11:00') at time zone 'America/Caracas', '35000000-0000-0000-0000-000000000001', 20),
  ('36000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'edit', -2, (now() at time zone 'America/Caracas')::date, '12:00', ((now() at time zone 'America/Caracas')::date::timestamp + time '12:00') at time zone 'America/Caracas', null, 19),
  ('36000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'activation', 0, (now() at time zone 'America/Caracas')::date, '13:00', ((now() at time zone 'America/Caracas')::date::timestamp + time '13:00') at time zone 'America/Caracas', null, 17),
  ('36000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'deactivation', 0, (now() at time zone 'America/Caracas')::date, '13:00', ((now() at time zone 'America/Caracas')::date::timestamp + time '13:00') at time zone 'America/Caracas', null, 17),
  ('36000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'entry', 1, (now() at time zone 'America/Caracas')::date - 30, '08:00', (((now() at time zone 'America/Caracas')::date - 30)::timestamp + time '08:00') at time zone 'America/Caracas', null, 0),
  ('36000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', '34000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'entry', 2, (now() at time zone 'America/Caracas')::date, '14:00', ((now() at time zone 'America/Caracas')::date::timestamp + time '14:00') at time zone 'America/Caracas', null, 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*)::integer from public.get_product_history('10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001')),
  7,
  'The default range includes exactly the latest 30 Caracas calendar days'
);

select results_eq(
  $$select type::text, return_id is not null
    from public.get_product_history('10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001')
    order by type::text, return_id is not null$$,
  $$values
    ('activation', false),
    ('deactivation', false),
    ('edit', false),
    ('entry', false),
    ('exit', false),
    ('exit', true),
    ('return', true)$$,
  'History exposes every audited event and distinguishes sales, changes, and incoming returns'
);

select is(
  (select array_agg(id)::text
   from public.get_product_history('10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001')),
  '{36000000-0000-0000-0000-000000000007,36000000-0000-0000-0000-000000000006,36000000-0000-0000-0000-000000000005,36000000-0000-0000-0000-000000000004,36000000-0000-0000-0000-000000000003,36000000-0000-0000-0000-000000000002,36000000-0000-0000-0000-000000000001}',
  'History is newest first with a deterministic id tie-breaker'
);

select is(
  (select count(*)::integer from public.get_product_history('10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000002')),
  0,
  'A product from another business is not mixed into the active business history'
);

select is(
  (select count(*)::integer from public.get_product_history('10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000003')),
  0,
  'A product without ledger events has an empty history'
);

select is(
  (select min(user_fullname) from public.get_product_history('10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001')),
  'Maria Admin',
  'History includes the responsible user'
);

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);

select is(
  (select count(*)::integer from public.get_product_history('10000000-0000-0000-0000-000000000001', '34000000-0000-0000-0000-000000000001')),
  0,
  'An authenticated user cannot read a business they cannot access'
);

select * from finish();
rollback;
