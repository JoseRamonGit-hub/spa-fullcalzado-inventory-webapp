-- Asociar una Orden Cashea a una Venta existente (REQ-011).

create function private.attach_cashea_order(
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
begin
  perform private.require_business_write_access(p_business_id);

  select s.date
  into v_sale_date
  from public.sales s
  where s.business_id = p_business_id
    and s.id = p_sale_id
  for update;

  if not found then
    raise exception 'Venta inexistente o perteneciente a otro negocio';
  end if;

  if v_sale_date <> (now() at time zone 'America/Caracas')::date and not private.is_admin() then
    raise exception 'Solo el Administrador puede asociar una Orden Cashea a una venta de otro día';
  end if;

  if exists (
    select 1
    from public.cashea_orders o
    where o.business_id = p_business_id
      and o.sale_id = p_sale_id
      and o.status <> 'voided'
  ) then
    raise exception 'Esta venta ya tiene una Orden Cashea';
  end if;

  return private.insert_cashea_order(p_business_id, p_sale_id, p_cashea);
end;
$$;

create function public.attach_cashea_order(
  p_business_id uuid,
  p_sale_id uuid,
  p_cashea jsonb
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.attach_cashea_order($1, $2, $3)
$$;

revoke all on function private.attach_cashea_order(uuid, uuid, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.attach_cashea_order(uuid, uuid, jsonb)
  from public, anon;

grant execute on function private.attach_cashea_order(uuid, uuid, jsonb)
  to authenticated, service_role;
grant execute on function public.attach_cashea_order(uuid, uuid, jsonb)
  to authenticated, service_role;
