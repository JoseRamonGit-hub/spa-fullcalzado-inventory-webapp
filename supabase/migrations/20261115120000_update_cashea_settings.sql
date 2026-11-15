create function private.update_cashea_settings(
  p_business_id uuid,
  p_service_fee_pct numeric,
  p_advance_fee_pct numeric,
  p_apply_to_pending boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recalculated integer := 0;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede cambiar la Comisión Cashea';
  end if;

  if p_service_fee_pct is null
    or p_advance_fee_pct is null
    or p_service_fee_pct not between 0 and 100
    or p_advance_fee_pct not between 0 and 100
  then
    raise exception 'Los porcentajes de la Comisión Cashea deben estar entre 0 y 100';
  end if;

  if p_service_fee_pct <> round(p_service_fee_pct, 2) or p_advance_fee_pct <> round(p_advance_fee_pct, 2) then
    raise exception 'Los porcentajes de la Comisión Cashea admiten como máximo dos decimales';
  end if;

  insert into public.app_settings (business_id, cashea_service_fee_pct, cashea_advance_fee_pct, updated_by, updated_at)
  values (p_business_id, p_service_fee_pct, p_advance_fee_pct, (select auth.uid()), now())
  on conflict (business_id) do update
  set cashea_service_fee_pct = excluded.cashea_service_fee_pct,
      cashea_advance_fee_pct = excluded.cashea_advance_fee_pct,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at;

  if coalesce(p_apply_to_pending, false) then
    update public.cashea_orders
    set service_fee_pct = p_service_fee_pct,
        advance_fee_pct = p_advance_fee_pct,
        expected_net_usd = financed_usd
          - round(total_usd * p_service_fee_pct / 100, 2)
          - round(financed_usd * p_advance_fee_pct / 100, 2)
    where business_id = p_business_id
      and status = 'pending';

    get diagnostics v_recalculated = row_count;
  end if;

  return v_recalculated;
end;
$$;

create function public.update_cashea_settings(
  p_business_id uuid,
  p_service_fee_pct numeric,
  p_advance_fee_pct numeric,
  p_apply_to_pending boolean default false
)
returns integer
language sql
security invoker
set search_path = ''
as $$
  select private.update_cashea_settings($1, $2, $3, $4)
$$;

revoke all on function private.update_cashea_settings(uuid, numeric, numeric, boolean)
  from public, anon, authenticated, service_role;
revoke all on function public.update_cashea_settings(uuid, numeric, numeric, boolean)
  from public, anon;

grant execute on function private.update_cashea_settings(uuid, numeric, numeric, boolean)
  to authenticated, service_role;
grant execute on function public.update_cashea_settings(uuid, numeric, numeric, boolean)
  to authenticated, service_role;
