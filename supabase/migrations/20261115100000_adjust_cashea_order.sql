create function private.adjust_cashea_order(
  p_business_id uuid,
  p_order_id uuid,
  p_order_number text,
  p_invoice_number text,
  p_total_usd numeric,
  p_paid_today_usd numeric,
  p_financed_usd numeric,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.cashea_orders%rowtype;
  v_order_number text := btrim(p_order_number);
  v_invoice_number text := btrim(p_invoice_number);
  v_sale_total_usd numeric;
  v_constraint text;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede ajustar una Orden Cashea';
  end if;

  if nullif(btrim(p_note), '') is null then
    raise exception 'La nota del ajuste es requerida';
  end if;

  perform private.validate_cashea_order_input(
    jsonb_build_object(
      'order_number', p_order_number,
      'invoice_number', p_invoice_number,
      'total_usd', p_total_usd,
      'paid_today_usd', p_paid_today_usd,
      'financed_usd', p_financed_usd
    )
  );

  select *
  into v_order
  from public.cashea_orders o
  where o.business_id = p_business_id
    and o.id = p_order_id
  for update;

  if not found then
    raise exception 'Orden Cashea inexistente o perteneciente a otro negocio';
  end if;

  if v_order.status = 'collected' then
    raise exception 'Una Orden Cashea Cobrada no se ajusta: primero revierte su depósito';
  end if;

  if v_order.status = 'voided' then
    raise exception 'Una Orden Cashea Anulada no se ajusta';
  end if;

  if (v_order.order_number, v_order.invoice_number, v_order.total_usd, v_order.paid_today_usd, v_order.financed_usd)
    = (v_order_number, v_invoice_number, p_total_usd, p_paid_today_usd, p_financed_usd)
  then
    raise exception 'El ajuste no cambia ningún dato de la Orden Cashea';
  end if;

  select coalesce(sum(t.total_usd), 0)
  into v_sale_total_usd
  from public.transactions t
  where t.business_id = p_business_id
    and t.sale_id = v_order.sale_id;

  if p_financed_usd > v_sale_total_usd then
    raise exception 'El Monto financiado no puede superar el total de la Venta';
  end if;

  begin
    update public.cashea_orders
    set order_number = v_order_number,
        invoice_number = v_invoice_number,
        total_usd = p_total_usd,
        paid_today_usd = p_paid_today_usd,
        financed_usd = p_financed_usd,
        expected_net_usd = p_financed_usd
          - round(p_total_usd * v_order.service_fee_pct / 100, 2)
          - round(p_financed_usd * v_order.advance_fee_pct / 100, 2)
    where business_id = p_business_id
      and id = p_order_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;

      if v_constraint = 'cashea_orders_business_order_number_active_key' then
        raise exception 'Ya existe una Orden Cashea con ese número en este negocio';
      end if;

      raise;
  end;

  insert into public.cashea_order_adjustments (
    business_id,
    order_id,
    previous_order_number,
    new_order_number,
    previous_invoice_number,
    new_invoice_number,
    previous_total_usd,
    new_total_usd,
    previous_paid_today_usd,
    new_paid_today_usd,
    previous_financed_usd,
    new_financed_usd,
    note,
    created_by
  )
  values (
    p_business_id,
    p_order_id,
    v_order.order_number,
    v_order_number,
    v_order.invoice_number,
    v_invoice_number,
    v_order.total_usd,
    p_total_usd,
    v_order.paid_today_usd,
    p_paid_today_usd,
    v_order.financed_usd,
    p_financed_usd,
    btrim(p_note),
    (select auth.uid())
  );
end;
$$;

create function public.adjust_cashea_order(
  p_business_id uuid,
  p_order_id uuid,
  p_order_number text,
  p_invoice_number text,
  p_total_usd numeric,
  p_paid_today_usd numeric,
  p_financed_usd numeric,
  p_note text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.adjust_cashea_order($1, $2, $3, $4, $5, $6, $7, $8)
$$;

revoke all on function private.adjust_cashea_order(uuid, uuid, text, text, numeric, numeric, numeric, text)
  from public, anon, authenticated, service_role;
revoke all on function public.adjust_cashea_order(uuid, uuid, text, text, numeric, numeric, numeric, text)
  from public, anon;

grant execute on function private.adjust_cashea_order(uuid, uuid, text, text, numeric, numeric, numeric, text)
  to authenticated, service_role;
grant execute on function public.adjust_cashea_order(uuid, uuid, text, text, numeric, numeric, numeric, text)
  to authenticated, service_role;
