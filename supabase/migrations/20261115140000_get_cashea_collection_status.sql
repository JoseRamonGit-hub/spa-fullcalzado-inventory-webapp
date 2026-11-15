create function private.get_cashea_collection_status(
  p_business_id uuid,
  p_from date,
  p_to date
)
returns table (
  sale_date date,
  orders_count integer,
  collected_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_business_access(p_business_id) then
    raise exception 'Negocio inexistente, inactivo o no autorizado';
  end if;

  return query
  select
    cashea_order.sale_date,
    count(*)::integer,
    (count(*) filter (where cashea_order.status = 'collected'))::integer
  from public.cashea_orders cashea_order
  where cashea_order.business_id = p_business_id
    and cashea_order.status <> 'voided'
    and (p_from is null or cashea_order.sale_date >= p_from)
    and (p_to is null or cashea_order.sale_date <= p_to)
  group by cashea_order.sale_date
  order by cashea_order.sale_date;
end;
$$;

create function public.get_cashea_collection_status(
  p_business_id uuid,
  p_from date default null,
  p_to date default null
)
returns table (
  sale_date date,
  orders_count integer,
  collected_count integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_cashea_collection_status(p_business_id, p_from, p_to)
$$;

revoke all on function private.get_cashea_collection_status(uuid, date, date)
  from public, anon, authenticated, service_role;
revoke all on function public.get_cashea_collection_status(uuid, date, date)
  from public, anon;

grant execute on function private.get_cashea_collection_status(uuid, date, date)
  to authenticated, service_role;
grant execute on function public.get_cashea_collection_status(uuid, date, date)
  to authenticated, service_role;
