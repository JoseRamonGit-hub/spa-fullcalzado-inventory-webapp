-- El cierre de caja separa lo financiado (REQ-004, D-05, D-14).
--
-- get_cash_close_summary añade cuatro columnas: el Por cobrar Cashea y el
-- Cashea anulado por devolución, en USD y en Bs. con la tasa de cada venta.
-- El Total producido (net_usd, net_ves) resta el primero y suma el segundo.
-- El cambio de tipo de retorno obliga a hacer drop y recrear ambas funciones.
--
-- private.get_dashboard_daily_metrics consume el resumen por nombre de columna
-- dentro de plpgsql: no impide el drop y su Total producido hereda el descuento.

drop function public.get_cash_close_summary(uuid, date);
drop function private.get_cash_close_summary(uuid, date);

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
  net_ves numeric,
  cashea_receivable_usd numeric,
  cashea_receivable_ves numeric,
  cashea_voided_return_usd numeric,
  cashea_voided_return_ves numeric
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
  ),
  -- Por cobrar Cashea: órdenes de las Ventas del día que no se anularon, más
  -- las anuladas por «Devolución del cliente» en un día posterior al de su
  -- venta (se compensan el día de la anulación).
  -- Cashea anulado por devolución: órdenes anuladas este día por «Devolución
  -- del cliente» cuya Venta es de un día anterior.
  -- Ambos en Bs. con la tasa de cada venta.
  cashea_order_line as (
    select
      cashea_order.financed_usd,
      round(cashea_order.financed_usd * cashea_order.exchange_rate, 2) as financed_ves,
      cashea_order.sale_date = p_date
        and (
          cashea_order.status <> 'voided'
          or (
            cashea_order.void_reason = 'customer_return'
            and (cashea_order.voided_at at time zone 'America/Caracas')::date > cashea_order.sale_date
          )
        ) as is_receivable,
      cashea_order.status = 'voided'
        and cashea_order.void_reason = 'customer_return'
        and (cashea_order.voided_at at time zone 'America/Caracas')::date = p_date
        and cashea_order.sale_date < p_date as is_voided_return
    from public.cashea_orders cashea_order
    where cashea_order.business_id = p_business_id
      and (
        cashea_order.sale_date = p_date
        or (cashea_order.status = 'voided' and cashea_order.sale_date < p_date)
      )
  ),
  cashea_summary as (
    select
      coalesce(sum(line.financed_usd) filter (where line.is_receivable), 0)::numeric as cashea_receivable_usd,
      coalesce(sum(line.financed_ves) filter (where line.is_receivable), 0)::numeric as cashea_receivable_ves,
      coalesce(sum(line.financed_usd) filter (where line.is_voided_return), 0)::numeric as cashea_voided_return_usd,
      coalesce(sum(line.financed_ves) filter (where line.is_voided_return), 0)::numeric as cashea_voided_return_ves
    from cashea_order_line line
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
    transaction_summary.total_usd
      - return_summary.total_returns_usd
      - cashea_summary.cashea_receivable_usd
      + cashea_summary.cashea_voided_return_usd as net_usd,
    transaction_summary.total_ves
      - return_summary.total_returns_ves
      - cashea_summary.cashea_receivable_ves
      + cashea_summary.cashea_voided_return_ves as net_ves,
    cashea_summary.cashea_receivable_usd,
    cashea_summary.cashea_receivable_ves,
    cashea_summary.cashea_voided_return_usd,
    cashea_summary.cashea_voided_return_ves
  from transaction_summary
  cross join return_summary
  cross join cashea_summary;
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
  net_ves numeric,
  cashea_receivable_usd numeric,
  cashea_receivable_ves numeric,
  cashea_voided_return_usd numeric,
  cashea_voided_return_ves numeric
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

-- La generación guarda el desglose Cashea, también al cerrar por segunda vez
-- el mismo día (on conflict ... do update).
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
    total_returns_ves,
    cashea_receivable_usd,
    cashea_receivable_ves,
    cashea_voided_return_usd,
    cashea_voided_return_ves
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
    v_summary.total_returns_ves,
    v_summary.cashea_receivable_usd,
    v_summary.cashea_receivable_ves,
    v_summary.cashea_voided_return_usd,
    v_summary.cashea_voided_return_ves
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
    total_returns_ves = excluded.total_returns_ves,
    cashea_receivable_usd = excluded.cashea_receivable_usd,
    cashea_receivable_ves = excluded.cashea_receivable_ves,
    cashea_voided_return_usd = excluded.cashea_voided_return_usd,
    cashea_voided_return_ves = excluded.cashea_voided_return_ves
  returning *
  into v_result;

  return v_result;
end;
$$;

revoke all on function private.get_cash_close_summary(uuid, date)
from public, anon, authenticated, service_role;
revoke all on function public.get_cash_close_summary(uuid, date)
from public, anon;

grant execute on function private.get_cash_close_summary(uuid, date)
to authenticated, service_role;
grant execute on function public.get_cash_close_summary(uuid, date)
to authenticated, service_role;
