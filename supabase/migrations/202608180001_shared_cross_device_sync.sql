-- Shared ARRA Hub application records. These tables replace browser-local storage
-- so authenticated users see the same work from every device.

create schema if not exists private;

create table if not exists public.hub_work_items (
  id text primary key,
  workspace_key text not null default 'arra-squatch',
  title text not null check (char_length(title) between 1 and 300),
  brand text not null check (brand in ('ARRA', 'SQUATCH')),
  client_name text not null,
  project_key text not null,
  assignee_name text not null default 'Jonathan Ibarra',
  assignee_initials text not null default 'JI',
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'needs_approval', 'revisions', 'complete', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date not null,
  kind text not null check (kind in ('Task', 'Deliverable')),
  working_url text,
  review_url text,
  final_url text,
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_project_links (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null default 'arra-squatch',
  title text not null check (char_length(title) between 1 and 300),
  url text not null check (url ~* '^https?://'),
  project_key text not null,
  brand text not null check (brand in ('ARRA', 'SQUATCH')),
  kind text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hub_work_items_due_status_idx
  on public.hub_work_items (due_date, status);
create index if not exists hub_work_items_project_idx
  on public.hub_work_items (project_key);
create index if not exists hub_work_items_updated_idx
  on public.hub_work_items (updated_at desc);
create index if not exists hub_work_items_created_by_idx
  on public.hub_work_items (created_by);
create index if not exists hub_project_links_project_idx
  on public.hub_project_links (project_key);
create index if not exists hub_project_links_created_by_idx
  on public.hub_project_links (created_by);

create or replace function private.touch_hub_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.touch_hub_updated_at() from public, anon, authenticated;

drop trigger if exists touch_hub_work_items on public.hub_work_items;
create trigger touch_hub_work_items
before update on public.hub_work_items
for each row execute procedure private.touch_hub_updated_at();

drop trigger if exists touch_hub_project_links on public.hub_project_links;
create trigger touch_hub_project_links
before update on public.hub_project_links
for each row execute procedure private.touch_hub_updated_at();

create or replace function private.can_access_hub_project(target_project text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.user_roles role on role.user_id = profile.id
    where profile.id = auth.uid()
      and profile.active
      and (
        role.role in ('owner', 'admin')
        or exists (
          select 1
          from public.user_project_access access
          where access.user_id = profile.id
            and access.project_key = target_project
        )
      )
  );
$$;

create or replace function private.can_edit_hub_project(target_project text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.user_roles role on role.user_id = profile.id
    where profile.id = auth.uid()
      and profile.active
      and (
        role.role in ('owner', 'admin')
        or (
          role.role = 'partner'
          and exists (
            select 1
            from public.user_project_access access
            where access.user_id = profile.id
              and access.project_key = target_project
          )
        )
      )
  );
$$;

revoke all on function private.can_access_hub_project(text) from public, anon;
revoke all on function private.can_edit_hub_project(text) from public, anon;
grant execute on function private.can_access_hub_project(text) to authenticated;
grant execute on function private.can_edit_hub_project(text) to authenticated;

alter table public.hub_work_items enable row level security;
alter table public.hub_project_links enable row level security;

drop policy if exists "hub work items are visible by project" on public.hub_work_items;
create policy "hub work items are visible by project"
on public.hub_work_items for select to authenticated
using (private.can_access_hub_project(project_key));

drop policy if exists "hub work items can be created by editors" on public.hub_work_items;
create policy "hub work items can be created by editors"
on public.hub_work_items for insert to authenticated
with check (private.can_edit_hub_project(project_key));

drop policy if exists "hub work items can be updated by editors" on public.hub_work_items;
create policy "hub work items can be updated by editors"
on public.hub_work_items for update to authenticated
using (private.can_edit_hub_project(project_key))
with check (private.can_edit_hub_project(project_key));

drop policy if exists "hub work items can be deleted by editors" on public.hub_work_items;
create policy "hub work items can be deleted by editors"
on public.hub_work_items for delete to authenticated
using (private.can_edit_hub_project(project_key));

drop policy if exists "hub links are visible by project" on public.hub_project_links;
create policy "hub links are visible by project"
on public.hub_project_links for select to authenticated
using (private.can_access_hub_project(project_key));

drop policy if exists "hub links can be created by editors" on public.hub_project_links;
create policy "hub links can be created by editors"
on public.hub_project_links for insert to authenticated
with check (private.can_edit_hub_project(project_key));

drop policy if exists "hub links can be updated by editors" on public.hub_project_links;
create policy "hub links can be updated by editors"
on public.hub_project_links for update to authenticated
using (private.can_edit_hub_project(project_key))
with check (private.can_edit_hub_project(project_key));

drop policy if exists "hub links can be deleted by editors" on public.hub_project_links;
create policy "hub links can be deleted by editors"
on public.hub_project_links for delete to authenticated
using (private.can_edit_hub_project(project_key));

revoke all on public.hub_work_items, public.hub_project_links from anon;
grant select, insert, update, delete on public.hub_work_items, public.hub_project_links to authenticated;

insert into public.hub_work_items
  (id, title, brand, client_name, project_key, assignee_name, assignee_initials, status, priority, due_date, kind, working_url)
values
  ('T-2001', 'Liz & Junior wedding edit', 'ARRA', 'Liz & Junior', 'Wedding film', 'Jonathan Ibarra', 'JI', 'in_progress', 'urgent', '2026-08-15', 'Task', null),
  ('T-2002', 'Edit Furniture City video', 'SQUATCH', 'Furniture City', 'Social video', 'Jonathan Ibarra', 'JI', 'not_started', 'high', '2026-08-16', 'Task', null),
  ('T-2003', 'Dr. Tehrani — complete 2 videos today', 'SQUATCH', 'Dr. Tehrani', 'Daily video content', 'Jonathan Ibarra', 'JI', 'in_progress', 'high', '2026-08-16', 'Task', null),
  ('T-2004', 'Finish Terrazas logo', 'ARRA', 'Terrazas', 'Brand identity', 'Jonathan Ibarra', 'JI', 'in_progress', 'high', '2026-08-16', 'Deliverable', 'https://drive.google.com'),
  ('T-2005', 'Finish DME video edit', 'SQUATCH', 'DME', 'Video production', 'Jonathan Ibarra', 'JI', 'in_progress', 'high', '2026-08-16', 'Deliverable', 'https://drive.google.com'),
  ('T-2006', 'Video shoot with Ernesto', 'SQUATCH', 'Ernesto', 'Video shoot', 'Jonathan Ibarra', 'JI', 'not_started', 'high', '2026-08-17', 'Task', null),
  ('T-2007', '9:00 AM — Video shoot with Dr. Gabbay', 'SQUATCH', 'Dr. Gabbay', 'Video shoot', 'Jonathan Ibarra', 'JI', 'not_started', 'high', '2026-08-18', 'Task', null),
  ('T-2008', '6:00 PM — Video shoot with Nelson Salinas', 'SQUATCH', 'Nelson Salinas', 'Video shoot', 'Jonathan Ibarra', 'JI', 'not_started', 'high', '2026-08-18', 'Task', null),
  ('T-2009', 'Dr. Tehrani — next 2 daily videos', 'SQUATCH', 'Dr. Tehrani', 'Daily video content', 'Jonathan Ibarra', 'JI', 'not_started', 'normal', '2026-08-17', 'Task', null)
on conflict (id) do nothing;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'hub_work_items'
    ) then
      alter publication supabase_realtime add table public.hub_work_items;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'hub_project_links'
    ) then
      alter publication supabase_realtime add table public.hub_project_links;
    end if;
  end if;
end;
$$;
