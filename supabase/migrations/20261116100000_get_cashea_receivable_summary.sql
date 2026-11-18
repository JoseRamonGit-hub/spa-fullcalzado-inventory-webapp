create function private.get_cashea_receivable_summary(p_business_id uuid)
returns table (
  financed_usd numeric,
  expected_net_usd numeric,
  orders_count integer,
  oldest_sale_date date
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
    coalesce(sum(cashea_order.financed_usd), 0),
    coalesce(sum(cashea_order.expected_net_usd), 0),
    count(*)::integer,
    min(cashea_order.sale_date)
  from public.cashea_orders cashea_order
  where cashea_order.business_id = p_business_id
    and cashea_order.status = 'pending';
end;
$$;

create function public.get_cashea_receivable_summary(p_business_id uuid)
returns table (
  financed_usd numeric,
  expected_net_usd numeric,
  orders_count integer,
  oldest_sale_date date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_cashea_receivable_summary(p_business_id)
$$;

revoke all on function private.get_cashea_receivable_summary(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.get_cashea_receivable_summary(uuid)
  from public, anon;

grant execute on function private.get_cashea_receivable_summary(uuid)
  to authenticated, service_role;
grant execute on function public.get_cashea_receivable_summary(uuid)
  to authenticated, service_role;
