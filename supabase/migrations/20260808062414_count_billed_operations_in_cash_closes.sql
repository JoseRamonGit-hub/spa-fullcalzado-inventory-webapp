alter table public.cash_closes
  add column total_billed_operations integer;

alter table public.cash_closes
  add constraint cash_closes_total_billed_operations_check
  check (total_billed_operations is null or total_billed_operations >= 0);

create function private.get_cash_close_summary(
  p_business_id uuid,
  p_date date
)
returns table (
  billed_operations integer,
  total_transactions integer,
  total_units_sold integer,
  total_usd numeric,
  total_ves numeric,
  total_returns integer,
  total_returns_usd numeric,
  total_returns_ves numeric,
  net_usd numeric,
  net_ves numeric
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
  with transaction_summary as (
    select
      (
        count(distinct transaction_line.sale_id) filter (where transaction_line.sale_id is not null)
        + count(*) filter (
          where transaction_line.sale_id is null
            and transaction_line.return_id is null
        )
        + count(distinct transaction_line.return_id) filter (where transaction_line.return_id is not null)
      )::integer as billed_operations,
      count(*)::integer as total_transactions,
      coalesce(sum(transaction_line.quantity), 0)::integer as total_units_sold,
      coalesce(sum(transaction_line.total_usd), 0)::numeric as total_usd,
      coalesce(sum(transaction_line.total_ves), 0)::numeric as total_ves
    from public.transactions transaction_line
    where transaction_line.business_id = p_business_id
      and transaction_line.date = p_date
  ),
  return_summary as (
    select
      count(*)::integer as total_returns,
      coalesce(sum(customer_return.credit_usd), 0)::numeric as total_returns_usd,
      coalesce(sum(customer_return.credit_ves), 0)::numeric as total_returns_ves
    from public.returns customer_return
    where customer_return.business_id = p_business_id
      and customer_return.date = p_date
  )
  select
    transaction_summary.billed_operations,
    transaction_summary.total_transactions,
    transaction_summary.total_units_sold,
    transaction_summary.total_usd,
    transaction_summary.total_ves,
    return_summary.total_returns,
    return_summary.total_returns_usd,
    return_summary.total_returns_ves,
    transaction_summary.total_usd - return_summary.total_returns_usd as net_usd,
    transaction_summary.total_ves - return_summary.total_returns_ves as net_ves
  from transaction_summary
  cross join return_summary;
end;
$$;

create function public.get_cash_close_summary(
  p_business_id uuid,
  p_date date default null
)
returns table (
  billed_operations integer,
  total_transactions integer,
  total_units_sold integer,
  total_usd numeric,
  total_ves numeric,
  total_returns integer,
  total_returns_usd numeric,
  total_returns_ves numeric,
  net_usd numeric,
  net_ves numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_cash_close_summary(
    p_business_id,
    coalesce(p_date, (now() at time zone 'America/Caracas')::date)
  )
$$;

create or replace function private.generate_daily_cash_close(p_business_id uuid)
returns public.cash_closes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target_date date := (now() at time zone 'America/Caracas')::date;
  v_summary record;
  v_exchange_rate numeric(12,4);
  v_result public.cash_closes;
begin
  perform private.require_business_write_access(p_business_id);

  select *
  into v_summary
  from private.get_cash_close_summary(p_business_id, v_target_date);

  select er.rate
  into v_exchange_rate
  from public.exchange_rates er
  where er.business_id = p_business_id
  order by er.updated_at desc
  limit 1;

  if v_exchange_rate is null or v_exchange_rate <= 0 then
    raise exception 'El negocio no tiene una tasa de cambio vigente';
  end if;

  insert into public.cash_closes (
    business_id,
    date,
    total_transactions,
    total_billed_operations,
    total_units_sold,
    total_usd,
    total_ves,
    exchange_rate,
    closed_by,
    closed_at,
    total_returns,
    total_returns_usd,
    total_returns_ves
  )
  values (
    p_business_id,
    v_target_date,
    v_summary.total_transactions,
    v_summary.billed_operations,
    v_summary.total_units_sold,
    v_summary.net_usd,
    v_summary.net_ves,
    v_exchange_rate,
    v_actor,
    now(),
    v_summary.total_returns,
    v_summary.total_returns_usd,
    v_summary.total_returns_ves
  )
  on conflict (business_id, date) do update
  set
    total_transactions = excluded.total_transactions,
    total_billed_operations = excluded.total_billed_operations,
    total_units_sold = excluded.total_units_sold,
    total_usd = excluded.total_usd,
    total_ves = excluded.total_ves,
    exchange_rate = excluded.exchange_rate,
    closed_by = excluded.closed_by,
    closed_at = excluded.closed_at,
    total_returns = excluded.total_returns,
    total_returns_usd = excluded.total_returns_usd,
    total_returns_ves = excluded.total_returns_ves
  returning *
  into v_result;

  return v_result;
end;
$$;

revoke all on function private.get_cash_close_summary(uuid, date)
from public, anon, authenticated;
revoke all on function public.get_cash_close_summary(uuid, date)
from public, anon, authenticated;

grant execute on function private.get_cash_close_summary(uuid, date)
to authenticated, service_role;
grant execute on function public.get_cash_close_summary(uuid, date)
to authenticated, service_role;
