create function private.get_product_stock_alerts(
  p_business_id uuid,
  p_alert_type text default null,
  p_limit integer default 5,
  p_anchor_date date default null
)
returns table (
  alert_type text,
  alert_rank integer,
  product_id uuid,
  business_id uuid,
  code text,
  description text,
  stock integer,
  price_usd numeric,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  stagnant_since date,
  stagnant_days integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_anchor_date date := coalesce(p_anchor_date, (now() at time zone 'America/Caracas')::date);
begin
  if p_alert_type is not null and p_alert_type not in ('low_stock', 'stagnant') then
    raise exception 'Estado de inventario inválido';
  end if;

  if p_limit is not null and p_limit < 1 then
    raise exception 'El límite debe ser mayor que cero';
  end if;

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
  with movement_dates as (
    select
      movement.product_id,
      max(movement.date) filter (where movement.type = 'exit') as last_commercial_exit,
      min(movement.date) filter (
        where movement.type in ('entry', 'return', 'edit')
          and coalesce(movement.stock_before, 0) + movement.quantity > 0
      ) as first_positive_stock
    from public.inventory_movements movement
    where movement.business_id = p_business_id
    group by movement.product_id
  ),
  candidates as (
    select
      'low_stock'::text as alert_type,
      product.id as product_id,
      product.business_id,
      product.code::text,
      product.description::text,
      product.stock,
      product.price_usd,
      product.active,
      product.created_at,
      product.updated_at,
      null::date as stagnant_since,
      null::integer as stagnant_days
    from public.products product
    where product.business_id = p_business_id
      and product.active
      and product.stock <= 3
      and (p_alert_type is null or p_alert_type = 'low_stock')

    union all

    select
      'stagnant'::text,
      product.id,
      product.business_id,
      product.code::text,
      product.description::text,
      product.stock,
      product.price_usd,
      product.active,
      product.created_at,
      product.updated_at,
      coalesce(movements.last_commercial_exit, movements.first_positive_stock) as stagnant_since,
      (
        v_anchor_date - coalesce(movements.last_commercial_exit, movements.first_positive_stock) - 1
      )::integer as stagnant_days
    from public.products product
    join movement_dates movements on movements.product_id = product.id
    where product.business_id = p_business_id
      and product.stock > 0
      and coalesce(movements.last_commercial_exit, movements.first_positive_stock) < v_anchor_date - 30
      and (p_alert_type is null or p_alert_type = 'stagnant')
  ),
  ranked as (
    select
      candidate.*,
      row_number() over (
        partition by candidate.alert_type
        order by
          case when candidate.alert_type = 'low_stock' then candidate.stock end,
          case when candidate.alert_type = 'stagnant' then candidate.stagnant_since end,
          candidate.code,
          candidate.product_id
      )::integer as alert_rank
    from candidates candidate
  )
  select
    ranked.alert_type,
    ranked.alert_rank,
    ranked.product_id,
    ranked.business_id,
    ranked.code,
    ranked.description,
    ranked.stock,
    ranked.price_usd,
    ranked.active,
    ranked.created_at,
    ranked.updated_at,
    ranked.stagnant_since,
    ranked.stagnant_days
  from ranked
  where p_limit is null or ranked.alert_rank <= p_limit
  order by ranked.alert_type, ranked.alert_rank;
end;
$$;

create function public.get_product_stock_alerts(
  p_business_id uuid,
  p_alert_type text default null,
  p_limit integer default 5
)
returns table (
  alert_type text,
  alert_rank integer,
  product_id uuid,
  business_id uuid,
  code text,
  description text,
  stock integer,
  price_usd numeric,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  stagnant_since date,
  stagnant_days integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_product_stock_alerts(p_business_id, p_alert_type, p_limit, null)
$$;

revoke all on function private.get_product_stock_alerts(uuid, text, integer, date)
from public, anon, authenticated, service_role;
revoke all on function public.get_product_stock_alerts(uuid, text, integer)
from public, anon;

grant execute on function private.get_product_stock_alerts(uuid, text, integer, date)
to authenticated, service_role;
grant execute on function public.get_product_stock_alerts(uuid, text, integer)
to authenticated, service_role;
