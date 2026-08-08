create function private.get_dashboard_daily_metrics(p_business_id uuid)
returns table (
  dashboard_date date,
  total_billed_usd numeric,
  billed_operations integer,
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
  with billing_summary as (
    select
      coalesce(sum(transaction_line.total_usd), 0)::numeric as total_billed_usd,
      (
        count(distinct transaction_line.sale_id) filter (where transaction_line.sale_id is not null)
        + count(*) filter (
          where transaction_line.sale_id is null
            and transaction_line.return_id is null
        )
        + count(distinct transaction_line.return_id) filter (where transaction_line.return_id is not null)
      )::integer as billed_operations
    from public.transactions transaction_line
    where transaction_line.business_id = p_business_id
      and transaction_line.date = v_dashboard_date
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
    billing_summary.total_billed_usd,
    billing_summary.billed_operations,
    stock_summary.stock_units,
    stock_summary.products_in_stock,
    stock_summary.low_stock_products,
    current_rate.exchange_rate,
    current_rate.exchange_rate_source,
    current_rate.exchange_rate_updated_at
  from billing_summary
  cross join stock_summary
  left join current_rate on true;
end;
$$;

create function public.get_dashboard_daily_metrics(p_business_id uuid)
returns table (
  dashboard_date date,
  total_billed_usd numeric,
  billed_operations integer,
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
