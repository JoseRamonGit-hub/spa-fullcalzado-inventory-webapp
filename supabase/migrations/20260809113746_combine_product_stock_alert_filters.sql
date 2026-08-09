drop function public.get_product_stock_alerts(uuid, text, integer);

create function public.get_product_stock_alerts(
  p_business_id uuid,
  p_alert_type text default null,
  p_limit integer default 5,
  p_created_date date default null
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
  select alerts.*
  from private.get_product_stock_alerts(p_business_id, p_alert_type, p_limit, null) alerts
  where p_created_date is null
    or (alerts.created_at at time zone 'America/Caracas')::date = p_created_date
$$;

revoke all on function public.get_product_stock_alerts(uuid, text, integer, date)
from public, anon;

grant execute on function public.get_product_stock_alerts(uuid, text, integer, date)
to authenticated, service_role;
