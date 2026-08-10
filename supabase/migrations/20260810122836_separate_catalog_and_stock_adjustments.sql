alter table public.inventory_movements
  add column adjustment_reason text;

alter table public.inventory_movements
  add constraint inventory_movements_adjustment_reason_length_check
  check (
    adjustment_reason is null
    or char_length(btrim(adjustment_reason)) between 3 and 240
  );

alter table public.inventory_movements
  add constraint inventory_movements_adjustment_reason_type_check
  check (adjustment_reason is null or type = 'edit');

comment on column public.inventory_movements.adjustment_reason is
  'Motivo operativo obligatorio para los ajustes manuales de existencias.';

create or replace function private.edit_product(
  p_business_id uuid,
  p_product_id uuid,
  p_code varchar default null,
  p_description varchar default null,
  p_price_usd numeric default null,
  p_stock integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old public.products%rowtype;
  v_new_code varchar;
  v_new_description varchar;
  v_new_price numeric;
  v_date date := (now() at time zone 'America/Caracas')::date;
  v_time time := (now() at time zone 'America/Caracas')::time;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede editar productos';
  end if;

  select *
  into v_old
  from public.products
  where business_id = p_business_id
    and id = p_product_id
  for update;

  if not found then
    raise exception 'Producto no encontrado';
  end if;

  if p_stock is not null and p_stock <> v_old.stock then
    raise exception using
      errcode = '22023',
      message = 'Las existencias deben modificarse mediante un ajuste de inventario';
  end if;

  if p_code is not null and btrim(p_code) = '' then
    raise exception using errcode = '22023', message = 'El código es obligatorio';
  end if;

  if p_description is not null and btrim(p_description) = '' then
    raise exception using errcode = '22023', message = 'La descripción es obligatoria';
  end if;

  if p_price_usd is not null and p_price_usd < 0 then
    raise exception using errcode = '22023', message = 'El precio no puede ser negativo';
  end if;

  v_new_code := coalesce(btrim(p_code), v_old.code);
  v_new_description := coalesce(btrim(p_description), v_old.description);
  v_new_price := coalesce(p_price_usd, v_old.price_usd);

  if char_length(v_new_code) > 20 then
    raise exception using errcode = '22023', message = 'El código no puede superar 20 caracteres';
  end if;

  if char_length(v_new_description) > 120 then
    raise exception using errcode = '22023', message = 'La descripción no puede superar 120 caracteres';
  end if;

  if v_new_code = v_old.code
    and v_new_description = v_old.description
    and v_new_price = v_old.price_usd then
    raise exception using errcode = '22023', message = 'No se detectaron cambios en los datos del producto';
  end if;

  perform set_config('app.suppress_log_entry', 'true', true);

  update public.products
  set
    code = v_new_code,
    description = v_new_description,
    price_usd = v_new_price,
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
    created_at,
    stock_before,
    price_usd,
    price_usd_before,
    description_before,
    adjustment_reason
  )
  values (
    p_business_id,
    'edit',
    p_product_id,
    0,
    v_actor,
    v_date,
    v_time,
    now(),
    v_old.stock,
    v_new_price,
    case when v_new_price <> v_old.price_usd then v_old.price_usd else null end,
    case when v_new_description <> v_old.description then v_old.description else null end,
    null
  );

  return jsonb_build_object(
    'id', p_product_id,
    'business_id', p_business_id,
    'stock_before', v_old.stock,
    'stock_after', v_old.stock,
    'price_usd_before', v_old.price_usd,
    'price_usd_after', v_new_price
  );
end;
$$;

create function private.adjust_product_stock(
  p_business_id uuid,
  p_product_id uuid,
  p_expected_stock integer,
  p_new_stock integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old public.products%rowtype;
  v_reason text := btrim(p_reason);
  v_date date := (now() at time zone 'America/Caracas')::date;
  v_time time := (now() at time zone 'America/Caracas')::time;
begin
  perform private.require_business_write_access(p_business_id);

  if not private.is_admin() then
    raise exception 'Solo un administrador puede ajustar existencias';
  end if;

  if p_expected_stock is null or p_expected_stock < 0 then
    raise exception using errcode = '22023', message = 'El stock esperado no es válido';
  end if;

  if p_new_stock is null or p_new_stock < 0 then
    raise exception using errcode = '22023', message = 'Las existencias no pueden ser negativas';
  end if;

  if v_reason is null or char_length(v_reason) < 3 then
    raise exception using errcode = '22023', message = 'Indica un motivo de al menos 3 caracteres';
  end if;

  if char_length(v_reason) > 240 then
    raise exception using errcode = '22023', message = 'El motivo no puede superar 240 caracteres';
  end if;

  select *
  into v_old
  from public.products
  where business_id = p_business_id
    and id = p_product_id
  for update;

  if not found then
    raise exception 'Producto no encontrado';
  end if;

  if v_old.stock <> p_expected_stock then
    raise exception using
      errcode = '40001',
      message = format(
        'Las existencias cambiaron de %s a %s mientras revisabas el ajuste. Actualiza el producto e inténtalo nuevamente.',
        p_expected_stock,
        v_old.stock
      );
  end if;

  if p_new_stock = v_old.stock then
    raise exception using errcode = '22023', message = 'Las nuevas existencias deben ser diferentes a las actuales';
  end if;

  perform set_config('app.suppress_log_entry', 'true', true);

  update public.products
  set stock = p_new_stock,
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
    created_at,
    stock_before,
    price_usd,
    adjustment_reason
  )
  values (
    p_business_id,
    'edit',
    p_product_id,
    p_new_stock - v_old.stock,
    v_actor,
    v_date,
    v_time,
    now(),
    v_old.stock,
    v_old.price_usd,
    v_reason
  );

  return jsonb_build_object(
    'id', p_product_id,
    'business_id', p_business_id,
    'stock_before', v_old.stock,
    'stock_after', p_new_stock,
    'quantity', p_new_stock - v_old.stock,
    'reason', v_reason
  );
end;
$$;

create function public.adjust_product_stock(
  p_business_id uuid,
  p_product_id uuid,
  p_expected_stock integer,
  p_new_stock integer,
  p_reason text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.adjust_product_stock($1, $2, $3, $4, $5)
$$;

revoke all on function private.adjust_product_stock(uuid, uuid, integer, integer, text)
  from public, anon, authenticated, service_role;
grant execute on function private.adjust_product_stock(uuid, uuid, integer, integer, text)
  to authenticated, service_role;

revoke all on function public.adjust_product_stock(uuid, uuid, integer, integer, text)
  from public, anon;
grant execute on function public.adjust_product_stock(uuid, uuid, integer, integer, text)
  to authenticated, service_role;

drop function public.get_product_history(uuid, uuid, date, date, boolean);

create function public.get_product_history(
  p_business_id uuid,
  p_product_id uuid,
  p_start_date date default null,
  p_end_date date default null,
  p_show_all boolean default false
)
returns table (
  id uuid,
  business_id uuid,
  product_id uuid,
  user_id uuid,
  type public.movement_types,
  quantity integer,
  date date,
  "time" time without time zone,
  created_at timestamp with time zone,
  return_id uuid,
  stock_before integer,
  price_usd numeric,
  price_usd_before numeric,
  description_before text,
  adjustment_reason text,
  user_fullname text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with date_bounds as (
    select
      case
        when p_show_all then null
        else coalesce(p_start_date, (now() at time zone 'America/Caracas')::date - 29)
      end as start_date,
      case
        when p_show_all then null
        else coalesce(p_end_date, (now() at time zone 'America/Caracas')::date)
      end as end_date
  )
  select
    movement.id,
    movement.business_id,
    movement.product_id,
    movement.user_id,
    movement.type,
    movement.quantity,
    movement.date,
    movement.time,
    movement.created_at,
    movement.return_id,
    movement.stock_before,
    movement.price_usd,
    movement.price_usd_before,
    movement.description_before,
    movement.adjustment_reason,
    movement_user.fullname
  from public.inventory_movements movement
  join public.users movement_user on movement_user.id = movement.user_id
  cross join date_bounds
  where movement.business_id = p_business_id
    and movement.product_id = p_product_id
    and (date_bounds.start_date is null or movement.date >= date_bounds.start_date)
    and (date_bounds.end_date is null or movement.date <= date_bounds.end_date)
  order by movement.created_at desc nulls last, movement.id desc;
$$;

revoke all on function public.get_product_history(uuid, uuid, date, date, boolean)
  from public, anon;
grant execute on function public.get_product_history(uuid, uuid, date, date, boolean)
  to authenticated, service_role;
