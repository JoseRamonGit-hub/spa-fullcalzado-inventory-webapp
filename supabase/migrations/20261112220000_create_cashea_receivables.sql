-- Cuentas por cobrar Cashea: esquema completo del módulo (D-15) y registro de
-- la Venta Cashea con ingreso manual (REQ-001).
--
-- create_sale no se modifica: create_cashea_sale lo compone con
-- private.insert_cashea_order en la misma transacción.

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type public.cashea_order_status as enum ('pending', 'collected', 'voided');
create type public.cashea_void_reason as enum ('customer_return', 'registration_error');

-- ─── Depósitos Cashea ───────────────────────────────────────────────────────
-- Se crea antes que cashea_orders porque deposit_id la referencia.

create table public.cashea_deposits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  deposit_date date not null,
  received_ves numeric(14,2) not null,
  applied_rate numeric(12,4),
  expected_net_usd numeric(12,2) not null,
  implied_rate numeric(12,4),
  difference_usd numeric(12,2),
  reference text,
  reverted_at timestamptz,
  reverted_by uuid,
  revert_note text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint cashea_deposits_business_id_fkey
    foreign key (business_id) references public.businesses(id) on delete restrict,
  constraint cashea_deposits_reverted_by_fkey
    foreign key (reverted_by) references public.users(id) on delete restrict,
  constraint cashea_deposits_created_by_fkey
    foreign key (created_by) references public.users(id) on delete restrict,
  constraint cashea_deposits_business_id_id_key unique (business_id, id),
  constraint cashea_deposits_received_ves_check check (received_ves > 0),
  constraint cashea_deposits_applied_rate_check check (applied_rate is null or applied_rate > 0),
  constraint cashea_deposits_implied_rate_check check (implied_rate is null or implied_rate > 0),
  constraint cashea_deposits_difference_requires_rate_check
    check (difference_usd is null or applied_rate is not null),
  constraint cashea_deposits_revert_check check (
    (reverted_at is null and reverted_by is null and revert_note is null)
    or (
      reverted_at is not null
      and reverted_by is not null
      and revert_note is not null
      and btrim(revert_note) <> ''
    )
  )
);

-- ─── Órdenes Cashea ─────────────────────────────────────────────────────────

create table public.cashea_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  sale_id uuid not null,
  sale_date date not null,
  exchange_rate numeric(12,4) not null,
  order_number text not null,
  invoice_number text not null,
  total_usd numeric(12,2) not null,
  paid_today_usd numeric(12,2) not null,
  financed_usd numeric(12,2) not null,
  service_fee_pct numeric(5,2) not null,
  advance_fee_pct numeric(5,2) not null,
  expected_net_usd numeric(12,2) not null,
  status public.cashea_order_status not null default 'pending',
  deposit_id uuid,
  collected_at timestamptz,
  voided_at timestamptz,
  voided_by uuid,
  void_reason public.cashea_void_reason,
  void_note text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint cashea_orders_business_id_fkey
    foreign key (business_id) references public.businesses(id) on delete restrict,
  constraint cashea_orders_business_sale_fkey
    foreign key (business_id, sale_id) references public.sales(business_id, id) on delete restrict,
  constraint cashea_orders_business_deposit_fkey
    foreign key (business_id, deposit_id) references public.cashea_deposits(business_id, id) on delete restrict,
  constraint cashea_orders_voided_by_fkey
    foreign key (voided_by) references public.users(id) on delete restrict,
  constraint cashea_orders_created_by_fkey
    foreign key (created_by) references public.users(id) on delete restrict,
  constraint cashea_orders_business_id_id_key unique (business_id, id),
  constraint cashea_orders_exchange_rate_check check (exchange_rate > 0),
  constraint cashea_orders_order_number_check
    check (order_number = btrim(order_number) and char_length(order_number) between 1 and 40),
  constraint cashea_orders_invoice_number_check
    check (invoice_number = btrim(invoice_number) and char_length(invoice_number) between 1 and 40),
  constraint cashea_orders_total_usd_check check (total_usd > 0),
  constraint cashea_orders_financed_usd_check check (financed_usd > 0),
  constraint cashea_orders_paid_today_usd_check check (paid_today_usd >= 0),
  constraint cashea_orders_amounts_sum_check
    check (abs(paid_today_usd + financed_usd - total_usd) <= 0.01),
  constraint cashea_orders_fee_pct_check
    check (service_fee_pct between 0 and 100 and advance_fee_pct between 0 and 100),
  constraint cashea_orders_status_check check (
    (
      status = 'pending'
      and deposit_id is null
      and collected_at is null
      and voided_at is null
      and voided_by is null
      and void_reason is null
      and void_note is null
    )
    or (
      status = 'collected'
      and deposit_id is not null
      and collected_at is not null
      and voided_at is null
      and voided_by is null
      and void_reason is null
      and void_note is null
    )
    or (
      status = 'voided'
      and deposit_id is null
      and collected_at is null
      and voided_at is not null
      and voided_by is not null
      and void_reason is not null
      and void_note is not null
      and btrim(void_note) <> ''
    )
  )
);

-- Una Venta tiene como máximo una Orden Cashea no anulada; tras anularla se
-- puede asociar otra (REQ-011).
create unique index cashea_orders_business_sale_active_key
  on public.cashea_orders (business_id, sale_id)
  where status <> 'voided';

-- El número de orden no se repite entre las órdenes no anuladas del negocio.
create unique index cashea_orders_business_order_number_active_key
  on public.cashea_orders (business_id, order_number)
  where status <> 'voided';

create index cashea_orders_business_sale_date_idx
  on public.cashea_orders (business_id, sale_date);

create index cashea_orders_business_status_idx
  on public.cashea_orders (business_id, status);

create index cashea_orders_business_deposit_idx
  on public.cashea_orders (business_id, deposit_id)
  where deposit_id is not null;

-- ─── Auditoría de ajustes ───────────────────────────────────────────────────

create table public.cashea_order_adjustments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  order_id uuid not null,
  previous_order_number text not null,
  new_order_number text not null,
  previous_invoice_number text not null,
  new_invoice_number text not null,
  previous_total_usd numeric(12,2) not null,
  new_total_usd numeric(12,2) not null,
  previous_paid_today_usd numeric(12,2) not null,
  new_paid_today_usd numeric(12,2) not null,
  previous_financed_usd numeric(12,2) not null,
  new_financed_usd numeric(12,2) not null,
  note text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint cashea_order_adjustments_business_id_fkey
    foreign key (business_id) references public.businesses(id) on delete restrict,
  constraint cashea_order_adjustments_business_order_fkey
    foreign key (business_id, order_id) references public.cashea_orders(business_id, id) on delete restrict,
  constraint cashea_order_adjustments_created_by_fkey
    foreign key (created_by) references public.users(id) on delete restrict,
  constraint cashea_order_adjustments_note_check check (btrim(note) <> '')
);

create index cashea_order_adjustments_business_order_idx
  on public.cashea_order_adjustments (business_id, order_id);

-- ─── Comisiones Cashea por negocio ──────────────────────────────────────────
-- No se amplía el grant de update de app_settings: estas columnas solo se
-- cambian por RPC con verificación de rol.

alter table public.app_settings
  add column cashea_service_fee_pct numeric(5,2) not null default 4.00,
  add column cashea_advance_fee_pct numeric(5,2) not null default 4.00,
  add constraint app_settings_cashea_service_fee_pct_check
    check (cashea_service_fee_pct between 0 and 100),
  add constraint app_settings_cashea_advance_fee_pct_check
    check (cashea_advance_fee_pct between 0 and 100);

-- ─── Desglose Cashea en los cierres ─────────────────────────────────────────
-- Los cierres históricos quedan en null y no se recalculan (D-06).

alter table public.cash_closes
  add column cashea_receivable_usd numeric(12,2),
  add column cashea_receivable_ves numeric(12,2),
  add column cashea_voided_return_usd numeric(12,2),
  add column cashea_voided_return_ves numeric(12,2),
  add constraint cash_closes_cashea_receivable_usd_check
    check (cashea_receivable_usd is null or cashea_receivable_usd >= 0),
  add constraint cash_closes_cashea_receivable_ves_check
    check (cashea_receivable_ves is null or cashea_receivable_ves >= 0),
  add constraint cash_closes_cashea_voided_return_usd_check
    check (cashea_voided_return_usd is null or cashea_voided_return_usd >= 0),
  add constraint cash_closes_cashea_voided_return_ves_check
    check (cashea_voided_return_ves is null or cashea_voided_return_ves >= 0);

-- ─── Reglas de una Orden Cashea (REQ-001) ───────────────────────────────────

-- Valida la forma y los montos de p_cashea, sin depender de la Venta.
create function private.validate_cashea_order_input(p_cashea jsonb)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order_number text;
  v_invoice_number text;
  v_total_usd numeric;
  v_paid_today_usd numeric;
  v_financed_usd numeric;
begin
  if p_cashea is null or jsonb_typeof(p_cashea) <> 'object' then
    raise exception 'Los datos de la Orden Cashea son requeridos';
  end if;

  if jsonb_typeof(p_cashea->'order_number') is distinct from 'string'
    or jsonb_typeof(p_cashea->'invoice_number') is distinct from 'string'
    or jsonb_typeof(p_cashea->'total_usd') is distinct from 'number'
    or jsonb_typeof(p_cashea->'paid_today_usd') is distinct from 'number'
    or jsonb_typeof(p_cashea->'financed_usd') is distinct from 'number'
  then
    raise exception 'La Orden Cashea debe incluir número de orden, número de factura y montos válidos';
  end if;

  v_order_number := btrim(p_cashea->>'order_number');
  v_invoice_number := btrim(p_cashea->>'invoice_number');
  v_total_usd := (p_cashea->>'total_usd')::numeric;
  v_paid_today_usd := (p_cashea->>'paid_today_usd')::numeric;
  v_financed_usd := (p_cashea->>'financed_usd')::numeric;

  if char_length(v_order_number) not between 1 and 40 then
    raise exception 'El número de orden Cashea es requerido y admite como máximo 40 caracteres';
  end if;

  if char_length(v_invoice_number) not between 1 and 40 then
    raise exception 'El número de factura es requerido y admite como máximo 40 caracteres';
  end if;

  if v_total_usd <> round(v_total_usd, 2)
    or v_paid_today_usd <> round(v_paid_today_usd, 2)
    or v_financed_usd <> round(v_financed_usd, 2)
  then
    raise exception 'Los montos de la Orden Cashea admiten como máximo dos decimales';
  end if;

  -- Los montos se guardan en numeric(12,2).
  if v_total_usd >= 10000000000
    or v_paid_today_usd >= 10000000000
    or v_financed_usd >= 10000000000
  then
    raise exception 'Los montos de la Orden Cashea exceden el máximo permitido';
  end if;

  if v_total_usd <= 0 then
    raise exception 'El total de la Orden Cashea debe ser mayor a 0';
  end if;

  if v_financed_usd <= 0 then
    raise exception 'El Monto financiado debe ser mayor a 0';
  end if;

  if v_paid_today_usd < 0 then
    raise exception 'El monto Cobrado hoy no puede ser negativo';
  end if;

  if abs(v_paid_today_usd + v_financed_usd - v_total_usd) > 0.01 then
    raise exception 'Cobrado hoy más Monto financiado debe coincidir con el total de la Orden Cashea';
  end if;
end;
$$;

-- Helper interno compartido por create_cashea_sale y attach_cashea_order:
-- aplica las reglas de REQ-001, copia la fecha y la tasa de la Venta y los
-- porcentajes vigentes del negocio, y calcula el Neto esperado (7.5).
create function private.insert_cashea_order(
  p_business_id uuid,
  p_sale_id uuid,
  p_cashea jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale_date date;
  v_sale_total_usd numeric;
  v_exchange_rate numeric;
  v_service_fee_pct numeric(5,2);
  v_advance_fee_pct numeric(5,2);
  v_total_usd numeric(12,2);
  v_financed_usd numeric(12,2);
  v_order_id uuid;
  v_constraint text;
begin
  perform private.validate_cashea_order_input(p_cashea);

  select s.date
  into v_sale_date
  from public.sales s
  where s.business_id = p_business_id
    and s.id = p_sale_id;

  if not found then
    raise exception 'Venta inexistente o perteneciente a otro negocio';
  end if;

  -- sales no guarda tasa: todos los Renglones de una Venta la comparten.
  select coalesce(sum(t.total_usd), 0), max(t.exchange_rate)
  into v_sale_total_usd, v_exchange_rate
  from public.transactions t
  where t.business_id = p_business_id
    and t.sale_id = p_sale_id;

  if v_exchange_rate is null then
    raise exception 'La Venta no tiene Renglones';
  end if;

  v_total_usd := (p_cashea->>'total_usd')::numeric;
  v_financed_usd := (p_cashea->>'financed_usd')::numeric;

  if v_financed_usd > v_sale_total_usd then
    raise exception 'El Monto financiado no puede superar el total de la Venta';
  end if;

  select a.cashea_service_fee_pct, a.cashea_advance_fee_pct
  into v_service_fee_pct, v_advance_fee_pct
  from public.app_settings a
  where a.business_id = p_business_id;

  if not found then
    -- Mismos valores que el default de las columnas de app_settings.
    v_service_fee_pct := 4.00;
    v_advance_fee_pct := 4.00;
  end if;

  begin
    insert into public.cashea_orders (
      business_id,
      sale_id,
      sale_date,
      exchange_rate,
      order_number,
      invoice_number,
      total_usd,
      paid_today_usd,
      financed_usd,
      service_fee_pct,
      advance_fee_pct,
      expected_net_usd,
      created_by
    )
    values (
      p_business_id,
      p_sale_id,
      v_sale_date,
      v_exchange_rate,
      btrim(p_cashea->>'order_number'),
      btrim(p_cashea->>'invoice_number'),
      v_total_usd,
      (p_cashea->>'paid_today_usd')::numeric,
      v_financed_usd,
      v_service_fee_pct,
      v_advance_fee_pct,
      v_financed_usd
        - round(v_total_usd * v_service_fee_pct / 100, 2)
        - round(v_financed_usd * v_advance_fee_pct / 100, 2),
      (select auth.uid())
    )
    returning id into v_order_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;

      if v_constraint = 'cashea_orders_business_order_number_active_key' then
        raise exception 'Ya existe una Orden Cashea con ese número en este negocio';
      elsif v_constraint = 'cashea_orders_business_sale_active_key' then
        raise exception 'Esta venta ya tiene una Orden Cashea';
      end if;

      raise;
  end;

  return v_order_id;
end;
$$;

-- ─── create_cashea_sale ─────────────────────────────────────────────────────

create function private.create_cashea_sale(
  p_business_id uuid,
  p_items jsonb,
  p_exchange_rate numeric,
  p_cashea jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale_id uuid;
begin
  perform private.require_business_write_access(p_business_id);
  perform private.validate_cashea_order_input(p_cashea);

  v_sale_id := private.create_sale(p_business_id, p_items, p_exchange_rate);
  perform private.insert_cashea_order(p_business_id, v_sale_id, p_cashea);

  return v_sale_id;
end;
$$;

create function public.create_cashea_sale(
  p_business_id uuid,
  p_items jsonb,
  p_exchange_rate numeric,
  p_cashea jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_cashea_sale($1, $2, $3, $4)
$$;

-- ─── RLS: lectura por negocio, escritura solo por RPC ───────────────────────

alter table public.cashea_deposits enable row level security;
alter table public.cashea_orders enable row level security;
alter table public.cashea_order_adjustments enable row level security;

create policy cashea_deposits_select
on public.cashea_deposits
for select
to authenticated
using (private.has_business_access(business_id));

create policy cashea_orders_select
on public.cashea_orders
for select
to authenticated
using (private.has_business_access(business_id));

create policy cashea_order_adjustments_select
on public.cashea_order_adjustments
for select
to authenticated
using (private.has_business_access(business_id));

revoke all on table public.cashea_deposits from public, anon, authenticated;
revoke all on table public.cashea_orders from public, anon, authenticated;
revoke all on table public.cashea_order_adjustments from public, anon, authenticated;

grant select on table public.cashea_deposits to authenticated;
grant select on table public.cashea_orders to authenticated;
grant select on table public.cashea_order_adjustments to authenticated;

grant all on table public.cashea_deposits to service_role;
grant all on table public.cashea_orders to service_role;
grant all on table public.cashea_order_adjustments to service_role;

-- ─── Permisos de funciones ──────────────────────────────────────────────────

revoke all on function private.validate_cashea_order_input(jsonb)
  from public, anon, authenticated, service_role;
revoke all on function private.insert_cashea_order(uuid, uuid, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function private.create_cashea_sale(uuid, jsonb, numeric, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.create_cashea_sale(uuid, jsonb, numeric, jsonb)
  from public, anon;

grant execute on function private.create_cashea_sale(uuid, jsonb, numeric, jsonb)
  to authenticated, service_role;
grant execute on function public.create_cashea_sale(uuid, jsonb, numeric, jsonb)
  to authenticated, service_role;
