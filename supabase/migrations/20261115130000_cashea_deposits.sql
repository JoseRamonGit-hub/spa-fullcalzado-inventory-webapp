create function private.register_cashea_deposit(
  p_business_id uuid,
  p_order_ids uuid[],
  p_received_ves numeric,
  p_deposit_date date,
  p_applied_rate numeric default null,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_count integer := coalesce(cardinality(p_order_ids), 0);
  v_found_count integer;
  v_collected_count integer;
  v_voided_count integer;
  v_expected_net_usd numeric(12,2);
  v_deposit_id uuid;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede registrar un Depósito Cashea';
  end if;

  if v_order_count = 0 then
    raise exception 'Selecciona al menos una Orden Cashea';
  end if;

  if (select count(distinct id) from unnest(p_order_ids) id) < v_order_count then
    raise exception 'Una Orden Cashea está repetida en el depósito';
  end if;

  if p_received_ves is null or p_received_ves <= 0 then
    raise exception 'Los bolívares recibidos deben ser mayores a cero';
  end if;

  if p_applied_rate is not null and p_applied_rate <= 0 then
    raise exception 'La tasa aplicada debe ser mayor a cero';
  end if;

  if p_deposit_date is null then
    raise exception 'La fecha del depósito es requerida';
  end if;

  if p_deposit_date > (now() at time zone 'America/Caracas')::date then
    raise exception 'La fecha del depósito no puede ser futura';
  end if;

  select
    count(*),
    count(*) filter (where o.status = 'collected'),
    count(*) filter (where o.status = 'voided'),
    coalesce(sum(o.expected_net_usd), 0)
  into v_found_count, v_collected_count, v_voided_count, v_expected_net_usd
  from (
    select co.status, co.expected_net_usd
    from public.cashea_orders co
    where co.business_id = p_business_id
      and co.id = any(p_order_ids)
    order by co.id
    for update
  ) o;

  if v_found_count < v_order_count then
    raise exception 'Orden Cashea inexistente o perteneciente a otro negocio';
  end if;

  if v_collected_count > 0 then
    raise exception 'Una de las Órdenes Cashea ya está cobrada';
  end if;

  if v_voided_count > 0 then
    raise exception 'Una de las Órdenes Cashea está anulada';
  end if;

  insert into public.cashea_deposits (
    business_id,
    deposit_date,
    received_ves,
    applied_rate,
    expected_net_usd,
    implied_rate,
    difference_usd,
    reference,
    created_by
  )
  values (
    p_business_id,
    p_deposit_date,
    p_received_ves,
    p_applied_rate,
    v_expected_net_usd,
    case when v_expected_net_usd > 0 then nullif(round(p_received_ves / v_expected_net_usd, 4), 0) end,
    case when p_applied_rate is not null then v_expected_net_usd - round(p_received_ves / p_applied_rate, 2) end,
    nullif(btrim(p_reference), ''),
    (select auth.uid())
  )
  returning id into v_deposit_id;

  update public.cashea_orders
  set status = 'collected',
      deposit_id = v_deposit_id,
      collected_at = now()
  where business_id = p_business_id
    and id = any(p_order_ids);

  return v_deposit_id;
end;
$$;

create function public.register_cashea_deposit(
  p_business_id uuid,
  p_order_ids uuid[],
  p_received_ves numeric,
  p_deposit_date date,
  p_applied_rate numeric default null,
  p_reference text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.register_cashea_deposit($1, $2, $3, $4, $5, $6)
$$;

revoke all on function private.register_cashea_deposit(uuid, uuid[], numeric, date, numeric, text)
  from public, anon, authenticated, service_role;
revoke all on function public.register_cashea_deposit(uuid, uuid[], numeric, date, numeric, text)
  from public, anon;

grant execute on function private.register_cashea_deposit(uuid, uuid[], numeric, date, numeric, text)
  to authenticated, service_role;
grant execute on function public.register_cashea_deposit(uuid, uuid[], numeric, date, numeric, text)
  to authenticated, service_role;

create function private.revert_cashea_deposit(
  p_business_id uuid,
  p_deposit_id uuid,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reverted_at timestamptz;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede revertir un Depósito Cashea';
  end if;

  if nullif(btrim(p_note), '') is null then
    raise exception 'La nota de la reversión es requerida';
  end if;

  select d.reverted_at
  into v_reverted_at
  from public.cashea_deposits d
  where d.business_id = p_business_id
    and d.id = p_deposit_id
  for update;

  if not found then
    raise exception 'Depósito Cashea inexistente o perteneciente a otro negocio';
  end if;

  if v_reverted_at is not null then
    raise exception 'El Depósito Cashea ya está revertido';
  end if;

  update public.cashea_orders
  set status = 'pending',
      deposit_id = null,
      collected_at = null
  where business_id = p_business_id
    and deposit_id = p_deposit_id;

  update public.cashea_deposits
  set reverted_at = now(),
      reverted_by = (select auth.uid()),
      revert_note = btrim(p_note)
  where business_id = p_business_id
    and id = p_deposit_id;
end;
$$;

create function public.revert_cashea_deposit(
  p_business_id uuid,
  p_deposit_id uuid,
  p_note text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.revert_cashea_deposit($1, $2, $3)
$$;

revoke all on function private.revert_cashea_deposit(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.revert_cashea_deposit(uuid, uuid, text)
  from public, anon;

grant execute on function private.revert_cashea_deposit(uuid, uuid, text)
  to authenticated, service_role;
grant execute on function public.revert_cashea_deposit(uuid, uuid, text)
  to authenticated, service_role;
