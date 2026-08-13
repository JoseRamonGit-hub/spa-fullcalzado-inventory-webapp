drop function public.get_dashboard_top_products(uuid, text, text, date, date);
drop function private.get_dashboard_top_products(uuid, text, text, date, date, date);
drop function public.get_dashboard_sales_period(uuid, text, date, date);
drop function private.get_dashboard_sales_period(uuid, text, date, date, date);

create function private.get_dashboard_sales_period(
  p_business_id uuid,
  p_period text,
  p_anchor_date date default null,
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  period text,
  current_start date,
  current_end date,
  comparison_start date,
  comparison_end date,
  current_total_usd numeric,
  previous_total_usd numeric,
  current_operations integer,
  previous_operations integer,
  average_ticket_usd numeric,
  previous_average_ticket_usd numeric,
  bucket_index integer,
  bucket_label text,
  bucket_start date,
  bucket_end date,
  is_available boolean,
  bucket_total_usd numeric,
  comparison_bucket_start date,
  comparison_bucket_end date,
  comparison_bucket_total_usd numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_anchor_date date := coalesce(p_anchor_date, (now() at time zone 'America/Caracas')::date);
  v_current_start date;
  v_current_end date := v_anchor_date;
  v_comparison_start date;
  v_comparison_end date;
  v_duration_days integer;
begin
  if p_period not in ('today', 'week', 'month', 'custom') then
    raise exception 'Período de facturación inválido';
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

  if p_period = 'today' then
    v_current_start := v_anchor_date;
    v_comparison_start := v_anchor_date - 1;
    v_comparison_end := v_comparison_start;
  elsif p_period = 'week' then
    v_current_start := v_anchor_date - (extract(isodow from v_anchor_date)::integer - 1);
    v_comparison_start := v_current_start - 7;
    v_comparison_end := v_comparison_start + (v_current_end - v_current_start);
  elsif p_period = 'month' then
    v_current_start := date_trunc('month', v_anchor_date)::date;
    v_comparison_start := (v_current_start - interval '1 month')::date;
    v_comparison_end := least(v_comparison_start + (v_current_end - v_current_start), v_current_start - 1);
  else
    if p_start_date is null or p_end_date is null then
      raise exception 'Selecciona una fecha de inicio y una fecha de fin';
    end if;
    if p_end_date < p_start_date then
      raise exception 'La fecha de fin no puede ser anterior al inicio';
    end if;
    if p_start_date > v_anchor_date or p_end_date > v_anchor_date then
      raise exception 'El rango no puede incluir fechas futuras';
    end if;

    v_current_start := p_start_date;
    v_current_end := p_end_date;
    v_duration_days := v_current_end - v_current_start + 1;
    v_comparison_end := v_current_start - 1;
    v_comparison_start := v_comparison_end - (v_duration_days - 1);
  end if;

  return query
  with bucket_definitions as (
    select
      definition.bucket_index,
      definition.bucket_label,
      definition.bucket_start,
      definition.bucket_end,
      definition.bucket_start <= v_anchor_date as is_available
    from (
      select 0, 'Hoy'::text, v_anchor_date, v_anchor_date
      where p_period = 'today'

      union all

      select
        day_offset,
        (array['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])[day_offset + 1],
        v_current_start + day_offset,
        v_current_start + day_offset
      from generate_series(0, 6) day_offset
      where p_period = 'week'

      union all

      select
        group_index,
        case when group_start = group_end then group_start::text else group_start::text || '–' || group_end::text end,
        v_current_start + (group_start - 1),
        v_current_start + (group_end - 1)
      from (
        select
          group_index,
          1 + group_index * 7 as group_start,
          least(7 + group_index * 7, extract(day from (v_current_start + interval '1 month - 1 day'))::integer)
            as group_end
        from generate_series(0, 4) group_index
      ) month_group
      where p_period = 'month'
        and group_start <= extract(day from (v_current_start + interval '1 month - 1 day'))::integer

      union all

      select
        day_offset,
        to_char(v_current_start + day_offset, 'DD/MM/YY'),
        v_current_start + day_offset,
        v_current_start + day_offset
      from generate_series(0, coalesce(v_duration_days, 0) - 1) day_offset
      where p_period = 'custom' and v_duration_days <= 7

      union all

      select
        group_index,
        case
          when group_start = group_end then to_char(group_start, 'DD/MM/YY')
          else to_char(group_start, 'DD/MM/YY') || '–' || to_char(group_end, 'DD/MM/YY')
        end,
        group_start,
        group_end
      from (
        select
          group_index,
          v_current_start + group_index * 7 as group_start,
          least(v_current_start + group_index * 7 + 6, v_current_end) as group_end
        from generate_series(0, (coalesce(v_duration_days, 0) - 1) / 7) group_index
      ) custom_group
      where p_period = 'custom' and v_duration_days between 8 and 60

      union all

      select
        (row_number() over (order by month_start) - 1)::integer,
        to_char(month_start, 'MM/YYYY'),
        greatest(month_start::date, v_current_start),
        least((month_start + interval '1 month - 1 day')::date, v_current_end)
      from generate_series(
        date_trunc('month', v_current_start::timestamp),
        date_trunc('month', v_current_end::timestamp),
        interval '1 month'
      ) month_start
      where p_period = 'custom' and v_duration_days > 60
    ) definition(bucket_index, bucket_label, bucket_start, bucket_end)
  ),
  comparable_buckets as (
    select
      bucket.*,
      v_comparison_start + (bucket.bucket_start - v_current_start) as comparison_bucket_start,
      least(
        v_comparison_start + (bucket.bucket_end - v_current_start),
        v_comparison_end
      ) as comparison_bucket_end
    from bucket_definitions bucket
  ),
  scoped_lines as (
    select
      transaction_line.date,
      coalesce(transaction_line.total_usd, 0)::numeric as total_usd,
      case
        when transaction_line.sale_id is not null then 'sale:' || transaction_line.sale_id::text
        when transaction_line.return_id is not null then 'return:' || transaction_line.return_id::text
        else 'legacy:' || transaction_line.id::text
      end as operation_key
    from public.transactions transaction_line
    where transaction_line.business_id = p_business_id
      and transaction_line.date between least(v_comparison_start, v_current_start) and v_current_end
  ),
  period_summary as (
    select
      coalesce(sum(total_usd) filter (where date between v_current_start and v_current_end), 0)::numeric
        as current_total_usd,
      coalesce(sum(total_usd) filter (where date between v_comparison_start and v_comparison_end), 0)::numeric
        as previous_total_usd,
      count(distinct operation_key) filter (where date between v_current_start and v_current_end)::integer
        as current_operations,
      count(distinct operation_key) filter (where date between v_comparison_start and v_comparison_end)::integer
        as previous_operations
    from scoped_lines
  )
  select
    p_period,
    v_current_start,
    v_current_end,
    v_comparison_start,
    v_comparison_end,
    summary.current_total_usd,
    summary.previous_total_usd,
    summary.current_operations,
    summary.previous_operations,
    case when summary.current_operations = 0 then 0::numeric
      else summary.current_total_usd / summary.current_operations end,
    case when summary.previous_operations = 0 then 0::numeric
      else summary.previous_total_usd / summary.previous_operations end,
    bucket.bucket_index,
    bucket.bucket_label,
    bucket.bucket_start,
    bucket.bucket_end,
    bucket.is_available,
    coalesce(current_bucket.total_usd, 0)::numeric,
    bucket.comparison_bucket_start,
    bucket.comparison_bucket_end,
    coalesce(previous_bucket.total_usd, 0)::numeric
  from period_summary summary
  cross join comparable_buckets bucket
  left join lateral (
    select sum(line.total_usd)::numeric as total_usd
    from scoped_lines line
    where bucket.is_available
      and line.date between bucket.bucket_start and least(bucket.bucket_end, v_anchor_date)
  ) current_bucket on true
  left join lateral (
    select sum(line.total_usd)::numeric as total_usd
    from scoped_lines line
    where bucket.is_available
      and bucket.comparison_bucket_start <= bucket.comparison_bucket_end
      and line.date between bucket.comparison_bucket_start and bucket.comparison_bucket_end
  ) previous_bucket on true
  order by bucket.bucket_index;
end;
$$;

create function public.get_dashboard_sales_period(
  p_business_id uuid,
  p_period text default 'week',
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  period text,
  current_start date,
  current_end date,
  comparison_start date,
  comparison_end date,
  current_total_usd numeric,
  previous_total_usd numeric,
  current_operations integer,
  previous_operations integer,
  average_ticket_usd numeric,
  previous_average_ticket_usd numeric,
  bucket_index integer,
  bucket_label text,
  bucket_start date,
  bucket_end date,
  is_available boolean,
  bucket_total_usd numeric,
  comparison_bucket_start date,
  comparison_bucket_end date,
  comparison_bucket_total_usd numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_dashboard_sales_period(p_business_id, p_period, null, p_start_date, p_end_date)
$$;

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
  gross_usd numeric,
  participation_percentage numeric
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
      p_business_id, p_period, p_anchor_date, p_start_date, p_end_date
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
      total.*,
      case
        when p_rank_by = 'units' and sum(total.units) over () > 0
          then total.units::numeric * 100 / sum(total.units) over ()
        when p_rank_by = 'gross_usd' and sum(total.gross_usd) over () > 0
          then total.gross_usd * 100 / sum(total.gross_usd) over ()
        else 0::numeric
      end as participation_percentage
    from product_totals total
  )
  select
    ranked.rank,
    ranked.product_id,
    ranked.code,
    ranked.description,
    ranked.units,
    ranked.gross_usd,
    ranked.participation_percentage
  from ranked_products ranked
  order by ranked.rank
  limit 10;
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
  gross_usd numeric,
  participation_percentage numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_dashboard_top_products(
    p_business_id, p_period, p_rank_by, null, p_start_date, p_end_date
  )
$$;

revoke all on function private.get_dashboard_sales_period(uuid, text, date, date, date)
from public, anon, authenticated, service_role;
revoke all on function public.get_dashboard_sales_period(uuid, text, date, date)
from public, anon;
revoke all on function private.get_dashboard_top_products(uuid, text, text, date, date, date)
from public, anon, authenticated, service_role;
revoke all on function public.get_dashboard_top_products(uuid, text, text, date, date)
from public, anon;

grant execute on function private.get_dashboard_sales_period(uuid, text, date, date, date)
to authenticated, service_role;
grant execute on function public.get_dashboard_sales_period(uuid, text, date, date)
to authenticated, service_role;
grant execute on function private.get_dashboard_top_products(uuid, text, text, date, date, date)
to authenticated, service_role;
grant execute on function public.get_dashboard_top_products(uuid, text, text, date, date)
to authenticated, service_role;
