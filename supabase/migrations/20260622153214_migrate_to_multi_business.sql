-- ============================================================================
-- Multi-business migration
-- Existing production data is assumed to belong to Full Calzado C.A.
-- ============================================================================

begin;

-- Stable identifiers used by the migration, seed and frontend tests.
create table public.businesses (
  id uuid primary key,
  name varchar(120) not null,
  slug varchar(80) not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.businesses (id, name, slug)
values
  ('10000000-0000-0000-0000-000000000001', 'Full Calzado C.A.', 'full-calzado'),
  ('10000000-0000-0000-0000-000000000002', 'Zapatería Estilos C.A.', 'zapateria-estilos');

-- Remove the permissive policies before changing the tenant model.
drop policy if exists "Acceso total a usuarios logueados" on public.app_settings;
drop policy if exists "Acceso total a usuarios logueados" on public.cash_closes;
drop policy if exists "Acceso total a usuarios logueados" on public.exchange_rates;
drop policy if exists "Acceso total a usuarios logueados" on public.inventory_movements;
drop policy if exists "Acceso total a usuarios logueados" on public.products;
drop policy if exists "Acceso total a usuarios logueados" on public.transactions;
drop policy if exists "Acceso total a usuarios logueados" on public.users;
drop policy if exists "Authenticated users can create returns" on public.returns;
drop policy if exists "Authenticated users can insert return_items" on public.return_items;
drop policy if exists "Authenticated users can view return_items" on public.return_items;
drop policy if exists "Authenticated users can view returns" on public.returns;
drop policy if exists "Evitar borrado de settings" on public.app_settings;

-- Tenant columns are nullable only during the backfill.
alter table public.products add column business_id uuid;
alter table public.inventory_movements add column business_id uuid;
alter table public.transactions add column business_id uuid;
alter table public.returns add column business_id uuid;
alter table public.return_items add column business_id uuid;
alter table public.cash_closes add column business_id uuid;
alter table public.exchange_rates add column business_id uuid;
alter table public.app_settings add column business_id uuid;
alter table public.users add column default_business_id uuid;
alter table public.users add column is_active boolean not null default true;

-- Every row pulled from production belongs to Full Calzado C.A.
update public.products
set business_id = '10000000-0000-0000-0000-000000000001';

update public.inventory_movements
set business_id = '10000000-0000-0000-0000-000000000001';

update public.transactions
set business_id = '10000000-0000-0000-0000-000000000001';

update public.returns
set business_id = '10000000-0000-0000-0000-000000000001';

update public.return_items
set business_id = '10000000-0000-0000-0000-000000000001';

update public.cash_closes
set business_id = '10000000-0000-0000-0000-000000000001';

update public.exchange_rates
set business_id = '10000000-0000-0000-0000-000000000001';

update public.app_settings
set business_id = '10000000-0000-0000-0000-000000000001';

update public.users
set default_business_id = '10000000-0000-0000-0000-000000000001';

alter table public.products alter column business_id set not null;
alter table public.inventory_movements alter column business_id set not null;
alter table public.transactions alter column business_id set not null;
alter table public.returns alter column business_id set not null;
alter table public.return_items alter column business_id set not null;
alter table public.cash_closes alter column business_id set not null;
alter table public.exchange_rates alter column business_id set not null;
alter table public.app_settings alter column business_id set not null;
alter table public.users alter column default_business_id set not null;

-- User-to-business assignments. Admins are authorized for every business by
-- policy; employees can have one or more rows in this table.
create table public.user_business_access (
  user_id uuid not null references public.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

create index user_business_access_business_user_idx
  on public.user_business_access (business_id, user_id);

insert into public.user_business_access (user_id, business_id)
select
  u.id,
  '10000000-0000-0000-0000-000000000001'::uuid
from public.users u
where u.role = 'employee';

alter table public.users
  add constraint users_default_business_id_fkey
  foreign key (default_business_id)
  references public.businesses(id)
  on delete restrict;

-- app_settings is no longer a global singleton.
alter table public.app_settings drop constraint app_settings_pkey;
alter table public.app_settings drop constraint app_settings_id_check;
alter table public.app_settings drop column id;
alter table public.app_settings
  add constraint app_settings_pkey primary key (business_id);

insert into public.app_settings (business_id, exchange_rate_mode, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'manual', now()),
  ('10000000-0000-0000-0000-000000000002', 'manual', now())
on conflict (business_id) do nothing;

-- Seed Estilos with the latest production rate when one exists. On a clean
-- local reset, seed.sql inserts deterministic rates for both businesses.
insert into public.exchange_rates (business_id, rate, source, updated_by, updated_at)
select
  '10000000-0000-0000-0000-000000000002',
  er.rate,
  er.source,
  er.updated_by,
  now()
from public.exchange_rates er
where er.business_id = '10000000-0000-0000-0000-000000000001'
order by er.updated_at desc
limit 1;

-- Business-level uniqueness replaces global uniqueness.
alter table public.products drop constraint products_code_key;
alter table public.products
  add constraint products_business_code_key unique (business_id, code);
alter table public.products
  add constraint products_business_id_id_key unique (business_id, id);

alter table public.cash_closes drop constraint cash_closes_date_key;
alter table public.cash_closes
  add constraint cash_closes_business_date_key unique (business_id, date);

alter table public.returns
  add constraint returns_business_id_id_key unique (business_id, id);

-- Rates used by the application must be strictly positive.
alter table public.exchange_rates drop constraint exchange_rates_rate_check;
alter table public.exchange_rates
  add constraint exchange_rates_rate_check check (rate > 0);

-- Every tenant row references a real business.
alter table public.products
  add constraint products_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

alter table public.inventory_movements
  add constraint inventory_movements_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

alter table public.transactions
  add constraint transactions_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

alter table public.returns
  add constraint returns_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

alter table public.return_items
  add constraint return_items_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

alter table public.cash_closes
  add constraint cash_closes_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

alter table public.exchange_rates
  add constraint exchange_rates_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

alter table public.app_settings
  add constraint app_settings_business_id_fkey
  foreign key (business_id) references public.businesses(id) on delete restrict;

-- Composite foreign keys prevent cross-business references even from
-- privileged functions and future server-side code.
alter table public.inventory_movements
  drop constraint inventory_movements_product_id_fkey;
alter table public.inventory_movements
  drop constraint inventory_movements_return_id_fkey;
alter table public.inventory_movements
  add constraint inventory_movements_business_product_fkey
  foreign key (business_id, product_id)
  references public.products(business_id, id)
  on delete restrict;
alter table public.inventory_movements
  add constraint inventory_movements_business_return_fkey
  foreign key (business_id, return_id)
  references public.returns(business_id, id)
  on delete restrict;

alter table public.transactions
  drop constraint transactions_product_id_fkey;
alter table public.transactions
  drop constraint transactions_return_id_fkey;
alter table public.transactions
  add constraint transactions_business_product_fkey
  foreign key (business_id, product_id)
  references public.products(business_id, id)
  on delete restrict;
alter table public.transactions
  add constraint transactions_business_return_fkey
  foreign key (business_id, return_id)
  references public.returns(business_id, id)
  on delete restrict;

alter table public.return_items
  drop constraint return_items_product_id_fkey;
alter table public.return_items
  drop constraint return_items_return_id_fkey;
alter table public.return_items
  add constraint return_items_business_product_fkey
  foreign key (business_id, product_id)
  references public.products(business_id, id)
  on delete restrict;
alter table public.return_items
  add constraint return_items_business_return_fkey
  foreign key (business_id, return_id)
  references public.returns(business_id, id)
  on delete cascade;

-- Tenant-first indexes match every frontend query and the RLS predicates.
create index products_business_created_idx
  on public.products (business_id, created_at desc);
create index products_business_active_idx
  on public.products (business_id, active);
create index inventory_movements_business_created_idx
  on public.inventory_movements (business_id, created_at desc);
create index inventory_movements_business_product_idx
  on public.inventory_movements (business_id, product_id);
create index transactions_business_date_created_idx
  on public.transactions (business_id, date desc, created_at desc);
create index transactions_business_product_idx
  on public.transactions (business_id, product_id);
create index returns_business_date_created_idx
  on public.returns (business_id, date desc, created_at desc);
create index return_items_business_return_idx
  on public.return_items (business_id, return_id);
create index exchange_rates_business_updated_idx
  on public.exchange_rates (business_id, updated_at desc);

-- ============================================================================
-- Private authorization and business logic
-- ============================================================================

create schema if not exists private;
revoke all on schema private from public, anon;

create or replace function private.current_user_role()
returns public.roles
language sql
stable
security definer
set search_path = ''
as $$
  select u.role
  from public.users u
  where u.id = (select auth.uid())
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.current_user_role() = 'admin'::public.roles
    and exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.is_active
    ),
    false
  )
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.users u
      where u.id = (select auth.uid())
        and u.is_active
    ),
    false
  )
$$;

create or replace function private.has_operational_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.is_active_user()
    and private.current_user_role() in ('admin'::public.roles, 'employee'::public.roles),
    false
  )
$$;

create or replace function private.validate_business_access_payload(
  p_target_role public.roles,
  p_business_ids uuid[],
  p_default_business_id uuid
)
returns uuid[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_business_ids uuid[];
begin
  select coalesce(array_agg(distinct business_id order by business_id), array[]::uuid[])
  into v_business_ids
  from unnest(coalesce(p_business_ids, array[]::uuid[])) as business_id;

  if exists (
    select 1
    from unnest(v_business_ids) as business_id
    left join public.businesses b on b.id = business_id and b.is_active
    where b.id is null
  ) then
    raise exception 'Uno o más negocios no existen o están inactivos';
  end if;

  if p_default_business_id is null then
    raise exception 'El negocio predeterminado es requerido';
  end if;

  if not exists (
    select 1
    from public.businesses b
    where b.id = p_default_business_id
      and b.is_active
  ) then
    raise exception 'El negocio predeterminado no existe o está inactivo';
  end if;

  if p_target_role <> 'admin'::public.roles then
    if cardinality(v_business_ids) = 0 then
      raise exception 'Un empleado activo debe tener al menos un negocio asignado';
    end if;

    if p_default_business_id <> all(v_business_ids) then
      raise exception 'El negocio predeterminado debe pertenecer a los negocios asignados';
    end if;
  elsif cardinality(v_business_ids) > 0 and p_default_business_id <> all(v_business_ids) then
    raise exception 'Si se asignan negocios a un administrador, el negocio predeterminado debe pertenecer a esa lista';
  end if;

  return v_business_ids;
end;
$$;

create or replace function private.has_business_access(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and private.has_operational_role()
    and (
      private.is_admin()
      or exists (
        select 1
        from public.user_business_access uba
        where uba.user_id = (select auth.uid())
          and uba.business_id = p_business_id
      )
    )
$$;

create or replace function private.can_write_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.has_business_access(p_business_id)
    and exists (
      select 1
      from public.businesses b
      where b.id = p_business_id
        and b.is_active
    )
$$;

create or replace function private.require_business_write_access(p_business_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Usuario no autenticado';
  end if;

  if not private.has_operational_role() then
    raise exception 'Rol sin permisos operativos';
  end if;

  if not private.can_write_business(p_business_id) then
    raise exception 'Negocio inexistente, inactivo o no autorizado';
  end if;
end;
$$;

create or replace function private.edit_product(
  p_business_id uuid,
  p_product_id uuid,
  p_code varchar default null,
  p_description varchar default null,
  p_price_usd numeric default null,
  p_stock integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old public.products%rowtype;
  v_stock_diff integer;
  v_date date := (now() at time zone 'America/Caracas')::date;
  v_time time := (now() at time zone 'America/Caracas')::time;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede editar productos';
  end if;

  select *
  into v_old
  from public.products
  where business_id = p_business_id
    and id = p_product_id
  for update;

  if not found then
    raise exception 'Producto no encontrado';
  end if;

  v_stock_diff := coalesce(p_stock, v_old.stock) - v_old.stock;

  perform set_config('app.suppress_log_entry', 'true', true);

  update public.products
  set
    code = coalesce(p_code, v_old.code),
    description = coalesce(p_description, v_old.description),
    price_usd = coalesce(p_price_usd, v_old.price_usd),
    stock = coalesce(p_stock, v_old.stock),
    updated_at = now()
  where business_id = p_business_id
    and id = p_product_id;

  insert into public.inventory_movements (
    business_id,
    type,
    product_id,
    quantity,
    user_id,
    date,
    time,
    created_at,
    stock_before,
    price_usd,
    price_usd_before,
    description_before
  )
  values (
    p_business_id,
    'edit',
    p_product_id,
    v_stock_diff,
    v_actor,
    v_date,
    v_time,
    now(),
    v_old.stock,
    coalesce(p_price_usd, v_old.price_usd),
    case
      when p_price_usd is not null and p_price_usd <> v_old.price_usd
        then v_old.price_usd
      else null
    end,
    case
      when p_description is not null and p_description <> v_old.description
        then v_old.description
      else null
    end
  );

  return jsonb_build_object(
    'id', p_product_id,
    'business_id', p_business_id,
    'stock_before', v_old.stock,
    'stock_after', coalesce(p_stock, v_old.stock),
    'price_usd_before', v_old.price_usd,
    'price_usd_after', coalesce(p_price_usd, v_old.price_usd)
  );
end;
$$;

create or replace function private.set_product_active(
  p_business_id uuid,
  p_product_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede activar o desactivar productos';
  end if;

  update public.products
  set active = p_active,
      updated_at = now()
  where business_id = p_business_id
    and id = p_product_id;

  if not found then
    raise exception 'Producto no encontrado';
  end if;
end;
$$;

create or replace function private.generate_daily_cash_close(p_business_id uuid)
returns public.cash_closes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target_date date := (now() at time zone 'America/Caracas')::date;
  v_total_transactions integer;
  v_total_units integer;
  v_total_usd numeric(12,2);
  v_total_ves numeric(12,2);
  v_exchange_rate numeric(12,4);
  v_returns_count integer;
  v_returns_usd numeric(12,2);
  v_returns_ves numeric(12,2);
  v_result public.cash_closes;
begin
  perform private.require_business_write_access(p_business_id);

  select
    count(id),
    coalesce(sum(quantity), 0),
    coalesce(sum(total_usd), 0),
    coalesce(sum(total_ves), 0)
  into
    v_total_transactions,
    v_total_units,
    v_total_usd,
    v_total_ves
  from public.transactions
  where business_id = p_business_id
    and date = v_target_date;

  select
    count(id),
    coalesce(sum(credit_usd), 0),
    coalesce(sum(credit_ves), 0)
  into
    v_returns_count,
    v_returns_usd,
    v_returns_ves
  from public.returns
  where business_id = p_business_id
    and date = v_target_date;

  select er.rate
  into v_exchange_rate
  from public.exchange_rates er
  where er.business_id = p_business_id
  order by er.updated_at desc
  limit 1;

  if v_exchange_rate is null or v_exchange_rate <= 0 then
    raise exception 'El negocio no tiene una tasa de cambio vigente';
  end if;

  insert into public.cash_closes (
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
  values (
    p_business_id,
    v_target_date,
    v_total_transactions,
    v_total_units,
    v_total_usd - v_returns_usd,
    v_total_ves - v_returns_ves,
    v_exchange_rate,
    v_actor,
    now(),
    v_returns_count,
    v_returns_usd,
    v_returns_ves
  )
  on conflict (business_id, date) do update
  set
    total_transactions = excluded.total_transactions,
    total_units_sold = excluded.total_units_sold,
    total_usd = excluded.total_usd,
    total_ves = excluded.total_ves,
    exchange_rate = excluded.exchange_rate,
    closed_by = excluded.closed_by,
    closed_at = excluded.closed_at,
    total_returns = excluded.total_returns,
    total_returns_usd = excluded.total_returns_usd,
    total_returns_ves = excluded.total_returns_ves
  returning *
  into v_result;

  return v_result;
end;
$$;

create or replace function private.process_return(
  p_business_id uuid,
  p_type text,
  p_returned_items jsonb,
  p_new_items jsonb,
  p_exchange_rate numeric,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_user_role public.roles;
  v_return_id uuid;
  v_credit_usd numeric(12,2) := 0;
  v_credit_ves numeric(12,2) := 0;
  v_new_total_usd numeric(12,2) := 0;
  v_new_total_ves numeric(12,2) := 0;
  v_diff_usd numeric(12,2) := 0;
  v_diff_ves numeric(12,2) := 0;
  v_return_type public.return_types;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_date date := (now() at time zone 'America/Caracas')::date;
  v_time time := (now() at time zone 'America/Caracas')::time;
begin
  perform private.require_business_write_access(p_business_id);
  v_user_role := private.current_user_role();

  if p_exchange_rate is null or p_exchange_rate <= 0 then
    raise exception 'La tasa de cambio es requerida y debe ser mayor a 0';
  end if;

  if p_returned_items is null
     or jsonb_typeof(p_returned_items) <> 'array'
     or jsonb_array_length(p_returned_items) = 0 then
    raise exception 'Debe indicar al menos un producto devuelto';
  end if;

  if p_new_items is not null and jsonb_typeof(p_new_items) <> 'array' then
    raise exception 'Los productos nuevos deben enviarse como una lista';
  end if;

  v_return_type := p_type::public.return_types;

  for v_item in select value from jsonb_array_elements(p_returned_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    if v_quantity <= 0 then
      raise exception 'Las cantidades deben ser mayores a cero';
    end if;

    if not exists (
      select 1
      from public.products p
      where p.business_id = p_business_id
        and p.id = v_product_id
    ) then
      raise exception 'Producto devuelto no pertenece al negocio';
    end if;
  end loop;

  if p_new_items is not null then
    for v_item in select value from jsonb_array_elements(p_new_items) loop
      v_product_id := (v_item->>'product_id')::uuid;
      v_quantity := (v_item->>'quantity')::integer;

      if v_quantity <= 0 then
        raise exception 'Las cantidades deben ser mayores a cero';
      end if;

      if not exists (
        select 1
        from public.products p
        where p.business_id = p_business_id
          and p.id = v_product_id
          and p.active
      ) then
        raise exception 'Producto de cambio inexistente, inactivo o de otro negocio';
      end if;
    end loop;
  end if;

  select
    coalesce(sum((item->>'price_usd')::numeric * (item->>'quantity')::integer), 0),
    coalesce(sum((item->>'price_ves')::numeric * (item->>'quantity')::integer), 0)
  into v_credit_usd, v_credit_ves
  from jsonb_array_elements(p_returned_items) item;

  if p_new_items is not null and jsonb_array_length(p_new_items) > 0 then
    select
      coalesce(sum((item->>'price_usd')::numeric * (item->>'quantity')::integer), 0),
      coalesce(sum((item->>'price_ves')::numeric * (item->>'quantity')::integer), 0)
    into v_new_total_usd, v_new_total_ves
    from jsonb_array_elements(p_new_items) item;
  end if;

  v_diff_usd := v_new_total_usd - v_credit_usd;
  v_diff_ves := v_new_total_ves - v_credit_ves;

  if v_user_role = 'employee' then
    if v_return_type = 'refund' then
      raise exception 'Solo un administrador puede procesar devoluciones';
    end if;

    if v_diff_usd < 0 then
      raise exception 'Solo un administrador puede procesar cambios con saldo a favor';
    end if;
  end if;

  insert into public.returns (
    business_id,
    type,
    credit_usd,
    credit_ves,
    difference_usd,
    difference_ves,
    exchange_rate,
    user_id,
    date,
    time,
    notes
  )
  values (
    p_business_id,
    v_return_type,
    v_credit_usd,
    v_credit_ves,
    v_diff_usd,
    v_diff_ves,
    p_exchange_rate,
    v_actor,
    v_date,
    v_time,
    p_notes
  )
  returning id into v_return_id;

  for v_item in select value from jsonb_array_elements(p_returned_items) loop
    insert into public.return_items (
      business_id,
      return_id,
      product_id,
      quantity,
      price_usd,
      price_ves
    )
    values (
      p_business_id,
      v_return_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price_usd')::numeric,
      (v_item->>'price_ves')::numeric
    );
  end loop;

  if p_new_items is not null and jsonb_array_length(p_new_items) > 0 then
    for v_item in select value from jsonb_array_elements(p_new_items) loop
      insert into public.transactions (
        business_id,
        product_id,
        quantity,
        price_usd,
        price_ves,
        exchange_rate,
        user_id,
        date,
        time,
        return_id
      )
      values (
        p_business_id,
        (v_item->>'product_id')::uuid,
        (v_item->>'quantity')::integer,
        (v_item->>'price_usd')::numeric,
        (v_item->>'price_ves')::numeric,
        p_exchange_rate,
        v_actor,
        v_date,
        v_time,
        v_return_id
      );
    end loop;
  end if;

  return jsonb_build_object(
    'id', v_return_id,
    'business_id', p_business_id,
    'type', v_return_type,
    'credit_usd', v_credit_usd,
    'credit_ves', v_credit_ves,
    'difference_usd', v_diff_usd,
    'difference_ves', v_diff_ves,
    'exchange_rate', p_exchange_rate,
    'date', v_date,
    'time', v_time
  );
end;
$$;

create or replace function private.admin_set_user_business_access(
  p_user_id uuid,
  p_business_ids uuid[],
  p_default_business_id uuid
)
returns public.users
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.users%rowtype;
  v_business_ids uuid[];
  v_result public.users;
begin
  if (select auth.uid()) is null or not private.is_admin() then
    raise exception 'Solo un administrador puede gestionar accesos de usuarios';
  end if;

  select *
  into v_target
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;

  v_business_ids := private.validate_business_access_payload(v_target.role, p_business_ids, p_default_business_id);

  delete from public.user_business_access
  where user_id = p_user_id;

  insert into public.user_business_access (user_id, business_id)
  select p_user_id, business_id
  from unnest(v_business_ids) as business_id;

  update public.users
  set default_business_id = p_default_business_id,
      updated_at = now()
  where id = p_user_id
  returning *
  into v_result;

  return v_result;
end;
$$;

create or replace function private.admin_update_user(
  p_user_id uuid,
  p_fullname text,
  p_role public.roles,
  p_is_active boolean,
  p_business_ids uuid[],
  p_default_business_id uuid
)
returns public.users
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target public.users%rowtype;
  v_business_ids uuid[];
  v_result public.users;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Solo un administrador puede actualizar usuarios';
  end if;

  select *
  into v_target
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Usuario no encontrado';
  end if;

  if p_fullname is null or length(trim(p_fullname)) < 2 then
    raise exception 'El nombre del usuario es requerido';
  end if;

  if p_role is null then
    raise exception 'El rol del usuario es requerido';
  end if;

  if p_is_active is null then
    raise exception 'El estado del usuario es requerido';
  end if;

  if p_is_active is false
     and p_user_id = v_actor
     and not exists (
       select 1
       from public.users u
       where u.id <> p_user_id
         and u.role = 'admin'::public.roles
         and u.is_active
     ) then
    raise exception 'No puedes desactivar el último administrador activo';
  end if;

  if v_target.role = 'admin'::public.roles
     and p_role <> 'admin'::public.roles
     and not exists (
       select 1
       from public.users u
       where u.id <> p_user_id
         and u.role = 'admin'::public.roles
         and u.is_active
     ) then
    raise exception 'Debe existir al menos un administrador activo';
  end if;

  v_business_ids := private.validate_business_access_payload(p_role, p_business_ids, p_default_business_id);

  delete from public.user_business_access
  where user_id = p_user_id;

  insert into public.user_business_access (user_id, business_id)
  select p_user_id, business_id
  from unnest(v_business_ids) as business_id;

  update public.users
  set fullname = trim(p_fullname),
      role = p_role,
      is_active = p_is_active,
      default_business_id = p_default_business_id,
      updated_at = now()
  where id = p_user_id
  returning *
  into v_result;

  return v_result;
end;
$$;

-- Trigger functions live outside the exposed public schema.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, fullname, role, default_business_id)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'fullname'), ''),
      'employee' || nextval('public.new_user_fallback_seq')
    ),
    'employee',
    (
      select b.id
      from public.businesses b
      where b.is_active
      order by b.created_at, b.id
      limit 1
    )
  );

  return new;
end;
$$;

create or replace function private.log_product_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_quantity integer;
begin
  if current_setting('app.suppress_log_entry', true) = 'true' then
    return new;
  end if;

  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if v_actor is null then
    raise exception 'Usuario no autenticado para registrar la entrada';
  end if;

  if not private.can_write_business(new.business_id) then
    raise exception 'Negocio inexistente, inactivo o no autorizado';
  end if;

  if tg_op = 'INSERT' then
    v_quantity := new.stock;
  else
    v_quantity := new.stock - old.stock;
  end if;

  if v_quantity > 0 then
    insert into public.inventory_movements (
      business_id,
      type,
      product_id,
      quantity,
      user_id,
      date,
      time,
      created_at,
      stock_before,
      price_usd
    )
    values (
      new.business_id,
      'entry',
      new.id,
      v_quantity,
      v_actor,
      (now() at time zone 'America/Caracas')::date,
      (now() at time zone 'America/Caracas')::time,
      now(),
      case when tg_op = 'INSERT' then 0 else old.stock end,
      new.price_usd
    );
  end if;

  return new;
end;
$$;

create or replace function private.sync_stock_on_entry_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
begin
  if new.type <> 'entry' then
    return new;
  end if;

  -- A movement emitted by log_product_entry already represents stock that is
  -- present on the product; do not add it twice.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  select *
  into v_product
  from public.products
  where business_id = new.business_id
    and id = new.product_id
  for update;

  if not found then
    raise exception 'Producto inexistente o perteneciente a otro negocio';
  end if;

  if not v_product.active then
    raise exception 'No se puede agregar existencia a un producto inactivo';
  end if;

  new.stock_before := v_product.stock;
  new.price_usd := coalesce(new.price_usd, v_product.price_usd);

  update public.products
  set stock = stock + new.quantity,
      updated_at = now()
  where business_id = new.business_id
    and id = new.product_id;

  return new;
end;
$$;

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

  if not v_product.active then
    raise exception 'No se puede vender un producto inactivo';
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

create or replace function private.process_return_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_return public.returns%rowtype;
  v_product public.products%rowtype;
begin
  select *
  into v_return
  from public.returns
  where business_id = new.business_id
    and id = new.return_id;

  if not found then
    raise exception 'Devolución inexistente o perteneciente a otro negocio';
  end if;

  select *
  into v_product
  from public.products
  where business_id = new.business_id
    and id = new.product_id
  for update;

  if not found then
    raise exception 'Producto inexistente o perteneciente a otro negocio';
  end if;

  update public.products
  set stock = stock + new.quantity,
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
    'return',
    new.product_id,
    new.quantity,
    v_return.user_id,
    v_return.date,
    v_return.time,
    now(),
    new.return_id,
    v_product.stock,
    v_product.price_usd
  );

  return new;
end;
$$;

-- Repoint triggers before removing their former public implementations.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop trigger if exists on_product_stock_entry on public.products;
create trigger on_product_stock_entry
after insert or update of stock on public.products
for each row execute function private.log_product_entry();

drop trigger if exists on_entry_movement_sync_stock on public.inventory_movements;
create trigger on_entry_movement_sync_stock
before insert on public.inventory_movements
for each row execute function private.sync_stock_on_entry_movement();

drop trigger if exists trg_prevent_movement_on_inactive_product on public.inventory_movements;

drop trigger if exists on_transaction_created on public.transactions;
create trigger on_transaction_created
after insert on public.transactions
for each row execute function private.process_sale_transaction();

drop trigger if exists on_return_item_created on public.return_items;
create trigger on_return_item_created
after insert on public.return_items
for each row execute function private.process_return_item();

-- Remove unsafe RPC signatures and public trigger functions.
drop function if exists public.edit_product(uuid, varchar, varchar, numeric, integer, uuid);
drop function if exists public.generate_daily_cash_close(uuid);
drop function if exists public.process_return(text, jsonb, jsonb, numeric, uuid, text);
drop function if exists public.handle_new_user();
drop function if exists public.log_product_entry();
drop function if exists public.prevent_movement_on_inactive_product();
drop function if exists public.process_return_item();
drop function if exists public.process_sale_transaction();
drop function if exists public.sync_stock_on_entry_movement();

-- Public wrappers are SECURITY INVOKER. The privileged implementation remains
-- in the unexposed private schema and performs every authorization check.
create function public.edit_product(
  p_business_id uuid,
  p_product_id uuid,
  p_code varchar default null,
  p_description varchar default null,
  p_price_usd numeric default null,
  p_stock integer default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.edit_product($1, $2, $3, $4, $5, $6)
$$;

create function public.set_product_active(
  p_business_id uuid,
  p_product_id uuid,
  p_active boolean
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_product_active($1, $2, $3)
$$;

create function public.generate_daily_cash_close(p_business_id uuid)
returns public.cash_closes
language sql
security invoker
set search_path = ''
as $$
  select private.generate_daily_cash_close($1)
$$;

create function public.process_return(
  p_business_id uuid,
  p_type text,
  p_returned_items jsonb,
  p_new_items jsonb default null,
  p_exchange_rate numeric default null,
  p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.process_return($1, $2, $3, $4, $5, $6)
$$;

create function public.admin_set_user_business_access(
  p_user_id uuid,
  p_business_ids uuid[],
  p_default_business_id uuid
)
returns public.users
language sql
security invoker
set search_path = ''
as $$
  select private.admin_set_user_business_access($1, $2, $3)
$$;

create function public.admin_update_user(
  p_user_id uuid,
  p_fullname text,
  p_role public.roles,
  p_is_active boolean,
  p_business_ids uuid[],
  p_default_business_id uuid
)
returns public.users
language sql
security invoker
set search_path = ''
as $$
  select private.admin_update_user($1, $2, $3, $4, $5, $6)
$$;

-- ============================================================================
-- Row-level security
-- ============================================================================

alter table public.businesses enable row level security;
alter table public.user_business_access enable row level security;

create policy businesses_select
on public.businesses
for select
to authenticated
using (
  (select private.is_admin())
  or (
    is_active
    and (select private.is_active_user())
    and exists (
      select 1
      from public.user_business_access uba
      where uba.user_id = (select auth.uid())
        and uba.business_id = businesses.id
    )
  )
);

create policy user_business_access_select
on public.user_business_access
for select
to authenticated
using (
  (select private.is_admin())
  or user_id = (select auth.uid())
);

create policy users_select
on public.users
for select
to authenticated
using ((select private.has_operational_role()));

create policy products_select
on public.products
for select
to authenticated
using (private.has_business_access(business_id));

create policy products_insert
on public.products
for insert
to authenticated
with check (
  private.can_write_business(business_id)
  and active
);

create policy inventory_movements_select
on public.inventory_movements
for select
to authenticated
using (private.has_business_access(business_id));

create policy inventory_movements_insert_entry
on public.inventory_movements
for insert
to authenticated
with check (
  private.can_write_business(business_id)
  and (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and type = 'entry'
  and return_id is null
);

create policy transactions_select
on public.transactions
for select
to authenticated
using (private.has_business_access(business_id));

create policy transactions_insert
on public.transactions
for insert
to authenticated
with check (
  private.can_write_business(business_id)
  and (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and return_id is null
);

create policy returns_select
on public.returns
for select
to authenticated
using (private.has_business_access(business_id));

create policy return_items_select
on public.return_items
for select
to authenticated
using (private.has_business_access(business_id));

create policy cash_closes_select
on public.cash_closes
for select
to authenticated
using (private.has_business_access(business_id));

create policy exchange_rates_select
on public.exchange_rates
for select
to authenticated
using (private.has_business_access(business_id));

create policy exchange_rates_insert
on public.exchange_rates
for insert
to authenticated
with check (
  private.can_write_business(business_id)
  and (select auth.uid()) is not null
  and updated_by = (select auth.uid())
);

create policy app_settings_select
on public.app_settings
for select
to authenticated
using (private.has_business_access(business_id));

create policy app_settings_update
on public.app_settings
for update
to authenticated
using (private.can_write_business(business_id))
with check (
  private.can_write_business(business_id)
  and (select auth.uid()) is not null
  and updated_by = (select auth.uid())
);

-- ============================================================================
-- Explicit privileges
-- ============================================================================

revoke all on table public.businesses from public, anon, authenticated;
revoke all on table public.user_business_access from public, anon, authenticated;
revoke all on table public.users from public, anon, authenticated;
revoke all on table public.products from public, anon, authenticated;
revoke all on table public.inventory_movements from public, anon, authenticated;
revoke all on table public.transactions from public, anon, authenticated;
revoke all on table public.returns from public, anon, authenticated;
revoke all on table public.return_items from public, anon, authenticated;
revoke all on table public.cash_closes from public, anon, authenticated;
revoke all on table public.exchange_rates from public, anon, authenticated;
revoke all on table public.app_settings from public, anon, authenticated;

grant select on table public.businesses to authenticated;
grant select on table public.user_business_access to authenticated;
grant select on table public.users to authenticated;
grant select, insert on table public.products to authenticated;
grant select, insert on table public.inventory_movements to authenticated;
grant select, insert on table public.transactions to authenticated;
grant select on table public.returns to authenticated;
grant select on table public.return_items to authenticated;
grant select on table public.cash_closes to authenticated;
grant select, insert on table public.exchange_rates to authenticated;
grant select on table public.app_settings to authenticated;
grant update (exchange_rate_mode, updated_by, updated_at)
  on table public.app_settings to authenticated;

grant all on table public.businesses to service_role;
grant all on table public.user_business_access to service_role;
grant all on table public.users to service_role;
grant all on table public.products to service_role;
grant all on table public.inventory_movements to service_role;
grant all on table public.transactions to service_role;
grant all on table public.returns to service_role;
grant all on table public.return_items to service_role;
grant all on table public.cash_closes to service_role;
grant all on table public.exchange_rates to service_role;
grant all on table public.app_settings to service_role;

revoke all on all functions in schema private
  from public, anon, authenticated, service_role;

revoke all on function public.edit_product(uuid, uuid, varchar, varchar, numeric, integer)
  from public, anon;
revoke all on function public.set_product_active(uuid, uuid, boolean)
  from public, anon;
revoke all on function public.generate_daily_cash_close(uuid)
  from public, anon;
revoke all on function public.process_return(uuid, text, jsonb, jsonb, numeric, text)
  from public, anon;
revoke all on function public.admin_set_user_business_access(uuid, uuid[], uuid)
  from public, anon;
revoke all on function public.admin_update_user(uuid, text, public.roles, boolean, uuid[], uuid)
  from public, anon;

grant usage on schema private to authenticated, service_role;
grant execute on function private.current_user_role() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_active_user() to authenticated, service_role;
grant execute on function private.has_operational_role() to authenticated, service_role;
grant execute on function private.validate_business_access_payload(public.roles, uuid[], uuid) to authenticated, service_role;
grant execute on function private.has_business_access(uuid) to authenticated, service_role;
grant execute on function private.can_write_business(uuid) to authenticated, service_role;
grant execute on function private.require_business_write_access(uuid) to authenticated, service_role;
grant execute on function private.edit_product(uuid, uuid, varchar, varchar, numeric, integer)
  to authenticated, service_role;
grant execute on function private.set_product_active(uuid, uuid, boolean)
  to authenticated, service_role;
grant execute on function private.generate_daily_cash_close(uuid)
  to authenticated, service_role;
grant execute on function private.process_return(uuid, text, jsonb, jsonb, numeric, text)
  to authenticated, service_role;
grant execute on function private.admin_set_user_business_access(uuid, uuid[], uuid)
  to authenticated, service_role;
grant execute on function private.admin_update_user(uuid, text, public.roles, boolean, uuid[], uuid)
  to authenticated, service_role;

grant execute on function public.edit_product(uuid, uuid, varchar, varchar, numeric, integer)
  to authenticated, service_role;
grant execute on function public.set_product_active(uuid, uuid, boolean)
  to authenticated, service_role;
grant execute on function public.generate_daily_cash_close(uuid)
  to authenticated, service_role;
grant execute on function public.process_return(uuid, text, jsonb, jsonb, numeric, text)
  to authenticated, service_role;
grant execute on function public.admin_set_user_business_access(uuid, uuid[], uuid)
  to authenticated, service_role;
grant execute on function public.admin_update_user(uuid, text, public.roles, boolean, uuid[], uuid)
  to authenticated, service_role;

revoke all on sequence public.new_user_fallback_seq from public, anon, authenticated;
grant usage, select on sequence public.new_user_fallback_seq to service_role;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated, service_role;

commit;
