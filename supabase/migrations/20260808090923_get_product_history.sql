create index inventory_movements_business_product_created_id_idx
  on public.inventory_movements (business_id, product_id, created_at desc, id desc);

create function public.get_product_history(
  p_business_id uuid,
  p_product_id uuid,
  p_start_date date default null,
  p_end_date date default null
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
  user_fullname text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with date_bounds as (
    select
      coalesce(
        p_start_date,
        (now() at time zone 'America/Caracas')::date - 29
      ) as start_date,
      coalesce(
        p_end_date,
        (now() at time zone 'America/Caracas')::date
      ) as end_date
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
    movement_user.fullname
  from public.inventory_movements movement
  join public.users movement_user on movement_user.id = movement.user_id
  cross join date_bounds
  where movement.business_id = p_business_id
    and movement.product_id = p_product_id
    and movement.date between date_bounds.start_date and date_bounds.end_date
  order by movement.created_at desc nulls last, movement.id desc;
$$;

revoke all on function public.get_product_history(uuid, uuid, date, date) from public, anon;
grant execute on function public.get_product_history(uuid, uuid, date, date) to authenticated, service_role;
