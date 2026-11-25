-- Anular una Orden Cashea con motivo (REQ-007, D-14).

create function private.void_cashea_order(
  p_business_id uuid,
  p_order_id uuid,
  p_reason public.cashea_void_reason,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.cashea_order_status;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede anular una Orden Cashea';
  end if;

  if p_reason is null then
    raise exception 'El motivo de la anulación es requerido';
  end if;

  if nullif(btrim(p_note), '') is null then
    raise exception 'La nota de la anulación es requerida';
  end if;

  select o.status
  into v_status
  from public.cashea_orders o
  where o.business_id = p_business_id
    and o.id = p_order_id
  for update;

  if not found then
    raise exception 'Orden Cashea inexistente o perteneciente a otro negocio';
  end if;

  if v_status = 'collected' then
    raise exception 'Una Orden Cashea Cobrada no se anula: primero revierte su depósito';
  end if;

  if v_status = 'voided' then
    raise exception 'La Orden Cashea ya está anulada';
  end if;

  update public.cashea_orders
  set status = 'voided',
      voided_at = now(),
      voided_by = (select auth.uid()),
      void_reason = p_reason,
      void_note = btrim(p_note)
  where business_id = p_business_id
    and id = p_order_id;
end;
$$;

create function public.void_cashea_order(
  p_business_id uuid,
  p_order_id uuid,
  p_reason public.cashea_void_reason,
  p_note text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.void_cashea_order($1, $2, $3, $4)
$$;

revoke all on function private.void_cashea_order(uuid, uuid, public.cashea_void_reason, text)
  from public, anon, authenticated, service_role;
revoke all on function public.void_cashea_order(uuid, uuid, public.cashea_void_reason, text)
  from public, anon;

grant execute on function private.void_cashea_order(uuid, uuid, public.cashea_void_reason, text)
  to authenticated, service_role;
grant execute on function public.void_cashea_order(uuid, uuid, public.cashea_void_reason, text)
  to authenticated, service_role;
