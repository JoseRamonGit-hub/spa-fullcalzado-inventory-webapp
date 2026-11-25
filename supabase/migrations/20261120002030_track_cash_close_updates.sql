create table public.cash_close_previous_versions (
  id bigint generated always as identity primary key,
  business_id uuid not null,
  date date not null,
  closed_by uuid not null references public.users(id),
  closed_at timestamptz,
  foreign key (business_id, date) references public.cash_closes(business_id, date) on delete cascade
);

create index cash_close_previous_versions_close_idx
  on public.cash_close_previous_versions (business_id, date, id);

alter table public.cash_close_previous_versions enable row level security;
revoke all on public.cash_close_previous_versions from anon, authenticated;
grant select on public.cash_close_previous_versions to authenticated;

create policy cash_close_previous_versions_select
  on public.cash_close_previous_versions for select to authenticated
  using (private.has_business_access(business_id));

create function private.archive_cash_close_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.cash_close_previous_versions (business_id, date, closed_by, closed_at)
  values (old.business_id, old.date, old.closed_by, old.closed_at);
  return new;
end;
$$;

revoke all on function private.archive_cash_close_version() from public, anon, authenticated;

create trigger archive_cash_close_version
  after update of closed_at on public.cash_closes
  for each row execute function private.archive_cash_close_version();
