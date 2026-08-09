-- Alertas compactas de Stock bajo y Productos estancados.

begin;

select plan(6);
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('app.suppress_log_entry', 'true', true);

insert into public.products (id, business_id, code, description, stock, price_usd, active)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'LOW-0', 'Sin stock', 0, 10, true),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'LOW-1', 'Una unidad', 1, 10, true),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'LOW-2', 'Dos unidades', 2, 10, true),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'LOW-3A', 'Tres unidades A', 3, 10, true),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'LOW-3B', 'Tres unidades B', 3, 10, true),
  ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'LOW-3C', 'Tres unidades C', 3, 10, true),
  ('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'LOW-OFF', 'Inactivo', 0, 10, false),
  ('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'LOW-4', 'Fuera de umbral', 4, 10, true),
  ('40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'ST-A', 'Estancado activo', 5, 10, true),
  ('40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'ST-B', 'Estancado inactivo', 2, 10, false),
  ('40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'ST-C', 'Salida en el límite', 5, 10, true),
  ('40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 'ST-D', 'Salida antigua', 5, 10, true),
  ('40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'ST-ZERO', 'Nunca tuvo stock', 0, 10, true),
  ('40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000002', 'OTHER', 'Otro Negocio', 0, 10, true),
  ('40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001', 'ST-NEW', 'Adquirió existencias después', 0, 10, true);

update public.products
set created_at = '2024-01-02 12:00:00+00'
where id = '40000000-0000-0000-0000-000000000001';

insert into public.returns (
  id, business_id, type, credit_usd, credit_ves, difference_usd, difference_ves,
  exchange_rate, user_id, date, time
)
values (
  '40000000-0000-0000-0000-000000000090',
  '10000000-0000-0000-0000-000000000001',
  'exchange', 10, 900, 0, 0, 90,
  'a0000000-0000-0000-0000-000000000001',
  '2024-02-01', '10:00'
);

insert into public.inventory_movements (
  id, business_id, type, product_id, quantity, user_id, date, time, stock_before, price_usd
)
values
  ('40000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 'edit', '40000000-0000-0000-0000-000000000011', 5, 'a0000000-0000-0000-0000-000000000001', '2024-01-31', '10:00', 0, 10),
  ('40000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', 'edit', '40000000-0000-0000-0000-000000000012', 2, 'a0000000-0000-0000-0000-000000000001', '2024-01-01', '10:00', 0, 10),
  ('40000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001', 'return', '40000000-0000-0000-0000-000000000012', 1, 'a0000000-0000-0000-0000-000000000001', '2024-02-25', '10:00', 1, 10),
  ('40000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000001', 'edit', '40000000-0000-0000-0000-000000000012', 0, 'a0000000-0000-0000-0000-000000000001', '2024-02-26', '10:00', 2, 10),
  ('40000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000001', 'edit', '40000000-0000-0000-0000-000000000013', 5, 'a0000000-0000-0000-0000-000000000001', '2024-01-01', '10:00', 0, 10),
  ('40000000-0000-0000-0000-000000000106', '10000000-0000-0000-0000-000000000001', 'exit', '40000000-0000-0000-0000-000000000013', 1, 'a0000000-0000-0000-0000-000000000001', '2024-02-01', '10:00', 6, 10),
  ('40000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000001', 'edit', '40000000-0000-0000-0000-000000000014', 5, 'a0000000-0000-0000-0000-000000000001', '2024-01-01', '10:00', 0, 10),
  ('40000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000001', 'exit', '40000000-0000-0000-0000-000000000014', 1, 'a0000000-0000-0000-0000-000000000001', '2024-01-31', '10:00', 6, 10);

update public.inventory_movements
set return_id = '40000000-0000-0000-0000-000000000090'
where id = '40000000-0000-0000-0000-000000000106';

insert into public.inventory_movements (
  id, business_id, type, product_id, quantity, user_id, date, time, stock_before, price_usd
)
values
  ('40000000-0000-0000-0000-000000000109', '10000000-0000-0000-0000-000000000001', 'entry', '40000000-0000-0000-0000-000000000014', 1, 'a0000000-0000-0000-0000-000000000001', '2024-02-25', '10:00', 5, 10),
  ('40000000-0000-0000-0000-000000000110', '10000000-0000-0000-0000-000000000001', 'entry', '40000000-0000-0000-0000-000000000017', 1, 'a0000000-0000-0000-0000-000000000001', '2024-01-31', '10:00', 0, 10);

select results_eq(
  $$
    select code, stock
    from private.get_product_stock_alerts(
      '10000000-0000-0000-0000-000000000001', 'low_stock', null, '2024-03-02'
    )
    where code like 'LOW-%'
  $$,
  $$
    values
      ('LOW-0'::text, 0),
      ('LOW-1', 1),
      ('LOW-2', 2),
      ('LOW-3A', 3),
      ('LOW-3B', 3),
      ('LOW-3C', 3)
  $$,
  'Stock bajo respeta umbral, actividad y orden estable'
);

select is(
  (
    select count(*)::integer
    from private.get_product_stock_alerts(
      '10000000-0000-0000-0000-000000000001', 'low_stock', 5, '2024-03-02'
    )
  ),
  5,
  'La lista compacta limita Stock bajo a cinco filas'
);

select results_eq(
  $$
    select code, active, stagnant_days
    from private.get_product_stock_alerts(
      '10000000-0000-0000-0000-000000000001', 'stagnant', null, '2024-03-02'
    )
  $$,
  $$
    values
      ('ST-B'::text, false, 60),
      ('ST-A', true, 30),
      ('ST-D', true, 30),
      ('ST-NEW', true, 30)
  $$,
  'Estancamiento cubre Venta, Cambio, entradas, devoluciones, ajustes, primera existencia y 30 días'
);

select is(
  (
    select count(*)::integer
    from private.get_product_stock_alerts(
      '10000000-0000-0000-0000-000000000001', 'low_stock', null, '2024-03-02'
    )
    where business_id <> '10000000-0000-0000-0000-000000000001'
  ),
  0,
  'Las alertas nunca mezclan Productos de otro Negocio'
);

select results_eq(
  $$
    select code
    from public.get_product_stock_alerts(
      '10000000-0000-0000-0000-000000000001', 'low_stock', 2147483647, '2024-01-02'
    )
  $$,
  $$ values ('LOW-0'::text) $$,
  'El contrato público combina estado de inventario y fecha de creación'
);

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);

select throws_ok(
  $$
    select *
    from public.get_product_stock_alerts(
      '10000000-0000-0000-0000-000000000001', 'stagnant', 5
    )
  $$,
  'P0001',
  'Negocio inexistente, inactivo o no autorizado',
  'El contrato público no expone alertas de otro Negocio'
);

select * from finish();

rollback;
