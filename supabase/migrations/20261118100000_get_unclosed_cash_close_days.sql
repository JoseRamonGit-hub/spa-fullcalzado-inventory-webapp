-- Días sin cierre: los días anteriores a hoy con al menos una Operación
-- facturada y sin Cierre de Caja, cada uno con su resumen.
--
-- La tienda abre todos los días y no hay forma de saber cuándo descansó: un
-- día sin ventas y sin cierre no cuenta como olvido. Hoy tampoco cuenta,
-- porque todavía puede cerrarse.

create function private.get_unclosed_cash_close_days(p_business_id uuid)
returns table (
  date date,
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
  select
    sale_day.date,
    summary.billed_operations,
    summary.total_transactions,
    summary.total_units_sold,
    summary.total_usd,
    summary.total_ves,
    summary.total_returns,
    summary.total_returns_usd,
    summary.total_returns_ves,
    summary.net_usd,
    summary.net_ves,
    summary.cashea_receivable_usd,
    summary.cashea_receivable_ves,
    summary.cashea_voided_return_usd,
    summary.cashea_voided_return_ves
  from (
    select distinct transaction_line.date
    from public.transactions transaction_line
    where transaction_line.business_id = p_business_id
      and transaction_line.date < (now() at time zone 'America/Caracas')::date
  ) sale_day
  cross join lateral private.get_cash_close_summary(p_business_id, sale_day.date) summary
  where not exists (
    select 1
    from public.cash_closes cash_close
    where cash_close.business_id = p_business_id
      and cash_close.date = sale_day.date
  )
  order by sale_day.date desc;
end;
$$;

create function public.get_unclosed_cash_close_days(p_business_id uuid)
returns table (
  date date,
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
  select * from private.get_unclosed_cash_close_days(p_business_id)
$$;

revoke all on function private.get_unclosed_cash_close_days(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.get_unclosed_cash_close_days(uuid)
  from public, anon;

grant execute on function private.get_unclosed_cash_close_days(uuid)
  to authenticated, service_role;
grant execute on function public.get_unclosed_cash_close_days(uuid)
  to authenticated, service_role;
