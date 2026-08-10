drop function public.get_dashboard_daily_metrics(uuid);
drop function private.get_dashboard_daily_metrics(uuid);

create function private.get_dashboard_daily_metrics(p_business_id uuid)
returns table (
  dashboard_date date,
  total_billed_usd numeric,
  total_produced_usd numeric,
  returns_credit_usd numeric,
  billed_operations integer,
  units_sold integer,
  stock_units integer,
  products_in_stock integer,
  low_stock_products integer,
  exchange_rate numeric,
  exchange_rate_source public.exchange_modes,
  exchange_rate_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_dashboard_date date := (now() at time zone 'America/Caracas')::date;
begin
  if not private.has_business_access(p_business_id)
    or not exists (
      select 1
      from public.businesses business
      where business.id = p_business_id
        and business.is_active
    )
  then
    raise exception 'Negocio inexistente, inactivo o no autorizado';
  end if;

  return query
  with cash_close_summary as (
    select *
    from private.get_cash_close_summary(p_business_id, v_dashboard_date)
  ),
  stock_summary as (
    select
      coalesce(sum(product.stock), 0)::integer as stock_units,
      count(*) filter (where product.stock > 0)::integer as products_in_stock,
      count(*) filter (where product.active and product.stock <= 3)::integer as low_stock_products
    from public.products product
    where product.business_id = p_business_id
  ),
  current_rate as (
    select
      rate.rate as exchange_rate,
      rate.source as exchange_rate_source,
      rate.updated_at as exchange_rate_updated_at
    from public.exchange_rates rate
    where rate.business_id = p_business_id
    order by rate.updated_at desc
    limit 1
  )
  select
    v_dashboard_date,
    cash_close_summary.total_usd,
    cash_close_summary.net_usd,
    cash_close_summary.total_returns_usd,
    cash_close_summary.billed_operations,
    cash_close_summary.total_units_sold,
    stock_summary.stock_units,
    stock_summary.products_in_stock,
    stock_summary.low_stock_products,
    current_rate.exchange_rate,
    current_rate.exchange_rate_source,
    current_rate.exchange_rate_updated_at
  from cash_close_summary
  cross join stock_summary
  left join current_rate on true;
end;
$$;

create function public.get_dashboard_daily_metrics(p_business_id uuid)
returns table (
  dashboard_date date,
  total_billed_usd numeric,
  total_produced_usd numeric,
  returns_credit_usd numeric,
  billed_operations integer,
  units_sold integer,
  stock_units integer,
  products_in_stock integer,
  low_stock_products integer,
  exchange_rate numeric,
  exchange_rate_source public.exchange_modes,
  exchange_rate_updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_dashboard_daily_metrics(p_business_id)
$$;

revoke all on function private.get_dashboard_daily_metrics(uuid)
from public, anon, authenticated, service_role;
revoke all on function public.get_dashboard_daily_metrics(uuid)
from public, anon;

grant execute on function private.get_dashboard_daily_metrics(uuid)
to authenticated, service_role;
grant execute on function public.get_dashboard_daily_metrics(uuid)
to authenticated, service_role;
