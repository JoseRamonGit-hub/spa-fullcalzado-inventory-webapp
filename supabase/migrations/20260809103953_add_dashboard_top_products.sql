create function private.get_dashboard_top_products(
  p_business_id uuid,
  p_period text,
  p_rank_by text,
  p_anchor_date date default null,
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  rank integer,
  product_id uuid,
  code text,
  description text,
  units bigint,
  gross_usd numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_rank_by not in ('units', 'gross_usd') then
    raise exception 'Modo de ranking inválido';
  end if;

  return query
  with period_bounds as (
    select period.current_start, period.current_end
    from private.get_dashboard_sales_period(
      p_business_id,
      p_period,
      p_anchor_date,
      p_start_date,
      p_end_date
    ) period
    limit 1
  ),
  product_totals as (
    select
      product.id as product_id,
      product.code::text as code,
      product.description::text as description,
      sum(transaction_line.quantity)::bigint as units,
      sum(coalesce(transaction_line.total_usd, transaction_line.price_usd * transaction_line.quantity))::numeric
        as gross_usd
    from period_bounds period
    join public.transactions transaction_line
      on transaction_line.business_id = p_business_id
      and transaction_line.date between period.current_start and period.current_end
    join public.products product
      on product.business_id = transaction_line.business_id
      and product.id = transaction_line.product_id
    group by product.id, product.code, product.description
  ),
  ranked_products as (
    select
      row_number() over (
        order by
          case when p_rank_by = 'units' then total.units end desc,
          case when p_rank_by = 'units' then total.gross_usd end desc,
          case when p_rank_by = 'gross_usd' then total.gross_usd end desc,
          case when p_rank_by = 'gross_usd' then total.units end desc,
          total.code,
          total.product_id
      )::integer as rank,
      total.product_id,
      total.code,
      total.description,
      total.units,
      total.gross_usd
    from product_totals total
  )
  select
    ranked.rank,
    ranked.product_id,
    ranked.code,
    ranked.description,
    ranked.units,
    ranked.gross_usd
  from ranked_products ranked
  order by ranked.rank
  limit 5;
end;
$$;

create function public.get_dashboard_top_products(
  p_business_id uuid,
  p_period text default 'week',
  p_rank_by text default 'units',
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  rank integer,
  product_id uuid,
  code text,
  description text,
  units bigint,
  gross_usd numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_dashboard_top_products(
    p_business_id,
    p_period,
    p_rank_by,
    null,
    p_start_date,
    p_end_date
  )
$$;

revoke all on function private.get_dashboard_top_products(uuid, text, text, date, date, date)
from public, anon, authenticated, service_role;
revoke all on function public.get_dashboard_top_products(uuid, text, text, date, date)
from public, anon;

grant execute on function private.get_dashboard_top_products(uuid, text, text, date, date, date)
to authenticated, service_role;
grant execute on function public.get_dashboard_top_products(uuid, text, text, date, date)
to authenticated, service_role;
