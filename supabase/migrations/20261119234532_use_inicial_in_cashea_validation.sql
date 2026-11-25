-- Usa el término Inicial en los mensajes de validación de una Orden Cashea.
create or replace function private.validate_cashea_order_input(p_cashea jsonb)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order_number text;
  v_invoice_number text;
  v_total_usd numeric;
  v_paid_today_usd numeric;
  v_financed_usd numeric;
begin
  if p_cashea is null or jsonb_typeof(p_cashea) <> 'object' then
    raise exception 'Los datos de la Orden Cashea son requeridos';
  end if;

  if jsonb_typeof(p_cashea->'order_number') is distinct from 'string'
    or jsonb_typeof(p_cashea->'invoice_number') is distinct from 'string'
    or jsonb_typeof(p_cashea->'total_usd') is distinct from 'number'
    or jsonb_typeof(p_cashea->'paid_today_usd') is distinct from 'number'
    or jsonb_typeof(p_cashea->'financed_usd') is distinct from 'number'
  then
    raise exception 'La Orden Cashea debe incluir número de orden, número de factura y montos válidos';
  end if;

  v_order_number := btrim(p_cashea->>'order_number');
  v_invoice_number := btrim(p_cashea->>'invoice_number');
  v_total_usd := (p_cashea->>'total_usd')::numeric;
  v_paid_today_usd := (p_cashea->>'paid_today_usd')::numeric;
  v_financed_usd := (p_cashea->>'financed_usd')::numeric;

  if char_length(v_order_number) not between 1 and 40 then
    raise exception 'El número de orden Cashea es requerido y admite como máximo 40 caracteres';
  end if;

  if char_length(v_invoice_number) not between 1 and 40 then
    raise exception 'El número de factura es requerido y admite como máximo 40 caracteres';
  end if;

  if v_total_usd <> round(v_total_usd, 2)
    or v_paid_today_usd <> round(v_paid_today_usd, 2)
    or v_financed_usd <> round(v_financed_usd, 2)
  then
    raise exception 'Los montos de la Orden Cashea admiten como máximo dos decimales';
  end if;

  -- Los montos se guardan en numeric(12,2).
  if v_total_usd >= 10000000000
    or v_paid_today_usd >= 10000000000
    or v_financed_usd >= 10000000000
  then
    raise exception 'Los montos de la Orden Cashea exceden el máximo permitido';
  end if;

  if v_total_usd <= 0 then
    raise exception 'El total de la Orden Cashea debe ser mayor a 0';
  end if;

  if v_financed_usd <= 0 then
    raise exception 'El Monto financiado debe ser mayor a 0';
  end if;

  if v_paid_today_usd < 0 then
    raise exception 'La Inicial no puede ser negativa';
  end if;

  if abs(v_paid_today_usd + v_financed_usd - v_total_usd) > 0.01 then
    raise exception 'Inicial más Monto financiado debe coincidir con el total de la Orden Cashea';
  end if;
end;
$$;
