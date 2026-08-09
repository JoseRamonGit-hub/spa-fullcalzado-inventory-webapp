alter table public.inventory_movements
  drop constraint inventory_movements_quantity_check;

alter table public.inventory_movements
  add constraint inventory_movements_quantity_check
  check (quantity > 0 or type in ('edit', 'activation', 'deactivation'));

create or replace function private.set_product_active(
  p_business_id uuid,
  p_product_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_product public.products%rowtype;
  v_date date := (now() at time zone 'America/Caracas')::date;
  v_time time := (now() at time zone 'America/Caracas')::time;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede activar o desactivar productos';
  end if;

  select *
  into v_product
  from public.products
  where business_id = p_business_id
    and id = p_product_id
  for update;

  if not found then
    raise exception 'Producto no encontrado';
  end if;

  if v_product.active is not distinct from p_active then
    return;
  end if;

  update public.products
  set active = p_active,
      updated_at = now()
  where business_id = p_business_id
    and id = p_product_id;

  insert into public.inventory_movements (
    business_id,
    type,
    product_id,
    quantity,
    user_id,
    date,
    time,
    created_at
  )
  values (
    p_business_id,
    case
      when p_active then 'activation'::public.movement_types
      else 'deactivation'::public.movement_types
    end,
    p_product_id,
    0,
    v_actor,
    v_date,
    v_time,
    now()
  );
end;
$$;
