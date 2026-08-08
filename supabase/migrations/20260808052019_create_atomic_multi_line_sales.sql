-- One row represents one checkout confirmation. Historical transaction rows
-- remain ungrouped because transactions.sale_id is intentionally nullable.
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid not null,
  date date not null default ((now() at time zone 'America/Caracas')::date),
  time time without time zone not null default ((now() at time zone 'America/Caracas')::time),
  created_at timestamptz not null default now(),
  constraint sales_business_id_fkey
    foreign key (business_id)
    references public.businesses(id)
    on delete restrict,
  constraint sales_user_id_fkey
    foreign key (user_id)
    references public.users(id)
    on delete restrict,
  constraint sales_business_id_id_key unique (business_id, id)
);

alter table public.transactions
  add column sale_id uuid;

alter table public.transactions
  add constraint transactions_business_sale_fkey
  foreign key (business_id, sale_id)
  references public.sales(business_id, id)
  on delete restrict;

alter table public.transactions
  add constraint transactions_sale_or_return_check
  check (sale_id is null or return_id is null);

create index sales_business_date_created_idx
  on public.sales (business_id, date desc, created_at desc);

create index transactions_business_sale_idx
  on public.transactions (business_id, sale_id)
  where sale_id is not null;

create or replace function private.create_sale(
  p_business_id uuid,
  p_items jsonb,
  p_exchange_rate numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_sale_id uuid;
  v_date date := (now() at time zone 'America/Caracas')::date;
  v_time time := (now() at time zone 'America/Caracas')::time;
  v_item jsonb;
begin
  perform private.require_business_write_access(p_business_id);

  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'La Venta debe contener una lista de Renglones';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'La Venta debe contener al menos un Renglón';
  end if;

  if p_exchange_rate is null or p_exchange_rate <= 0 then
    raise exception 'La tasa de cambio es requerida y debe ser mayor a 0';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as items(item)
    where jsonb_typeof(item->'product_id') is distinct from 'string'
      or jsonb_typeof(item->'quantity') is distinct from 'number'
      or jsonb_typeof(item->'price_usd') is distinct from 'number'
      or jsonb_typeof(item->'price_ves') is distinct from 'number'
  ) then
    raise exception 'Cada Renglón debe incluir Producto, cantidad e importes válidos';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as items(item)
    where (item->>'quantity')::numeric <= 0
      or (item->>'quantity')::numeric <> trunc((item->>'quantity')::numeric)
      or (item->>'price_usd')::numeric < 0
      or (item->>'price_ves')::numeric < 0
  ) then
    raise exception 'Cada Renglón debe tener cantidad positiva e importes no negativos';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as items(item)
    left join public.products product
      on product.business_id = p_business_id
      and product.id = (item->>'product_id')::uuid
    where product.id is null
  ) then
    raise exception 'Producto inexistente o perteneciente a otro negocio';
  end if;

  insert into public.sales (
    business_id,
    user_id,
    date,
    time
  )
  values (
    p_business_id,
    v_actor,
    v_date,
    v_time
  )
  returning id into v_sale_id;

  for v_item in
    select item
    from jsonb_array_elements(p_items) as items(item)
    order by item->>'product_id'
  loop
    insert into public.transactions (
      business_id,
      sale_id,
      product_id,
      quantity,
      price_usd,
      price_ves,
      exchange_rate,
      user_id,
      date,
      time
    )
    values (
      p_business_id,
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price_usd')::numeric,
      (v_item->>'price_ves')::numeric,
      p_exchange_rate,
      v_actor,
      v_date,
      v_time
    );
  end loop;

  return v_sale_id;
end;
$$;

create function public.create_sale(
  p_business_id uuid,
  p_items jsonb,
  p_exchange_rate numeric
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_sale($1, $2, $3)
$$;

-- Inactive Products remain sellable while they have stock. The existing stock
-- validation and row lock continue to protect every outgoing Renglón.
create or replace function private.process_sale_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
begin
  select *
  into v_product
  from public.products
  where business_id = new.business_id
    and id = new.product_id
  for update;

  if not found then
    raise exception 'Producto inexistente o perteneciente a otro negocio';
  end if;

  if v_product.stock < new.quantity then
    raise exception 'Existencia insuficiente para el producto %', v_product.code;
  end if;

  update public.products
  set stock = stock - new.quantity,
      updated_at = now()
  where business_id = new.business_id
    and id = new.product_id;

  insert into public.inventory_movements (
    business_id,
    type,
    product_id,
    quantity,
    user_id,
    date,
    time,
    created_at,
    return_id,
    stock_before,
    price_usd
  )
  values (
    new.business_id,
    'exit',
    new.product_id,
    new.quantity,
    new.user_id,
    new.date,
    new.time,
    new.created_at,
    new.return_id,
    v_product.stock,
    v_product.price_usd
  );

  return new;
end;
$$;

alter table public.sales enable row level security;

create policy sales_select
on public.sales
for select
to authenticated
using (private.has_business_access(business_id));

drop policy if exists transactions_insert on public.transactions;

revoke all on table public.sales from public, anon, authenticated;
revoke insert on table public.transactions from authenticated;
grant select on table public.sales to authenticated;
grant all on table public.sales to service_role;

revoke all on function private.create_sale(uuid, jsonb, numeric)
  from public, anon, authenticated, service_role;
revoke all on function public.create_sale(uuid, jsonb, numeric)
  from public, anon;

grant execute on function private.create_sale(uuid, jsonb, numeric)
  to authenticated, service_role;
grant execute on function public.create_sale(uuid, jsonb, numeric)
  to authenticated, service_role;
