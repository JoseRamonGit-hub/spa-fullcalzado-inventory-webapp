drop function public.get_dashboard_sales_period(uuid, text);
drop function private.get_dashboard_sales_period(uuid, text, date);

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
  bucket_index integer,
  bucket_label text,
  bucket_start date,
  bucket_end date,
  is_available boolean,
  bucket_total_usd numeric
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
    v_comparison_end := least(
      v_comparison_start + (v_current_end - v_current_start),
      (v_current_start - 1)
    );
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
      select
        0 as bucket_index,
        'Hoy'::text as bucket_label,
        v_anchor_date as bucket_start,
        v_anchor_date as bucket_end
      where p_period = 'today'

      union all

      select
        day_offset as bucket_index,
        (array['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])[day_offset + 1] as bucket_label,
        v_current_start + day_offset as bucket_start,
        v_current_start + day_offset as bucket_end
      from generate_series(0, 6) day_offset
      where p_period = 'week'

      union all

      select
        group_index as bucket_index,
        case
          when group_start = group_end then group_start::text
          else group_start::text || '–' || group_end::text
        end as bucket_label,
        v_current_start + (group_start - 1) as bucket_start,
        v_current_start + (group_end - 1) as bucket_end
      from (
        select
          group_index,
          1 + group_index * 7 as group_start,
          least(
            7 + group_index * 7,
            extract(day from (v_current_start + interval '1 month - 1 day'))::integer
          ) as group_end
        from generate_series(0, 4) group_index
      ) month_group
      where p_period = 'month'
        and group_start <= extract(day from (v_current_start + interval '1 month - 1 day'))::integer

      union all

      select
        day_offset as bucket_index,
        to_char(v_current_start + day_offset, 'DD/MM/YY') as bucket_label,
        v_current_start + day_offset as bucket_start,
        v_current_start + day_offset as bucket_end
      from generate_series(0, coalesce(v_duration_days, 0) - 1) day_offset
      where p_period = 'custom'
        and v_duration_days <= 7

      union all

      select
        group_index as bucket_index,
        case
          when group_start = group_end then to_char(group_start, 'DD/MM/YY')
          else to_char(group_start, 'DD/MM/YY') || '–' || to_char(group_end, 'DD/MM/YY')
        end as bucket_label,
        group_start as bucket_start,
        group_end as bucket_end
      from (
        select
          group_index,
          v_current_start + group_index * 7 as group_start,
          least(v_current_start + group_index * 7 + 6, v_current_end) as group_end
        from generate_series(0, (coalesce(v_duration_days, 0) - 1) / 7) group_index
      ) custom_group
      where p_period = 'custom'
        and v_duration_days between 8 and 60

      union all

      select
        (row_number() over (order by month_start) - 1)::integer as bucket_index,
        to_char(month_start, 'MM/YYYY') as bucket_label,
        greatest(month_start::date, v_current_start) as bucket_start,
        least((month_start + interval '1 month - 1 day')::date, v_current_end) as bucket_end
      from generate_series(
        date_trunc('month', v_current_start::timestamp),
        date_trunc('month', v_current_end::timestamp),
        interval '1 month'
      ) month_start
      where p_period = 'custom'
        and v_duration_days > 60
    ) definition
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
    period_summary.current_total_usd,
    period_summary.previous_total_usd,
    period_summary.current_operations,
    period_summary.previous_operations,
    case
      when period_summary.current_operations = 0 then 0::numeric
      else period_summary.current_total_usd / period_summary.current_operations
    end as average_ticket_usd,
    bucket.bucket_index,
    bucket.bucket_label,
    bucket.bucket_start,
    bucket.bucket_end,
    bucket.is_available,
    coalesce(bucket_summary.total_usd, 0)::numeric as bucket_total_usd
  from period_summary
  cross join bucket_definitions bucket
  left join lateral (
    select
      sum(line.total_usd)::numeric as total_usd
    from scoped_lines line
    where bucket.is_available
      and line.date between bucket.bucket_start and least(bucket.bucket_end, v_anchor_date)
  ) bucket_summary on true
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
  bucket_index integer,
  bucket_label text,
  bucket_start date,
  bucket_end date,
  is_available boolean,
  bucket_total_usd numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_dashboard_sales_period(p_business_id, p_period, null, p_start_date, p_end_date)
$$;

revoke all on function private.get_dashboard_sales_period(uuid, text, date, date, date)
from public, anon, authenticated, service_role;
revoke all on function public.get_dashboard_sales_period(uuid, text, date, date)
from public, anon;

grant execute on function private.get_dashboard_sales_period(uuid, text, date, date, date)
to authenticated, service_role;
grant execute on function public.get_dashboard_sales_period(uuid, text, date, date)
to authenticated, service_role;
