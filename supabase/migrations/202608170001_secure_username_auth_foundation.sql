create schema if not exists extensions;
create extension if not exists citext with schema extensions;

alter table public.profiles add column if not exists username extensions.citext;
alter table public.profiles add column if not exists must_change_password boolean not null default true;
alter table public.profiles add column if not exists active boolean not null default true;

update public.profiles
set username = concat('user_', left(replace(id::text, '-', ''), 12))
where username is null;

alter table public.profiles alter column username set not null;
create unique index if not exists profiles_username_idx on public.profiles(username);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_username_format
    check (username::text ~ '^[a-zA-Z0-9._-]{3,32}$');
  end if;
end;
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','partner','client')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_project_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, project_key)
);

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('owner','admin')
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_project_access enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated using (id = auth.uid() or private.is_admin());
create policy "roles_select_own_or_admin" on public.user_roles
for select to authenticated using (user_id = auth.uid() or private.is_admin());
create policy "access_select_own_or_admin" on public.user_project_access
for select to authenticated using (user_id = auth.uid() or private.is_admin());

revoke all on public.profiles, public.user_roles, public.user_project_access from anon;
grant select on public.profiles, public.user_roles, public.user_project_access to authenticated;

create index if not exists profiles_active_idx on public.profiles(active);
create index if not exists user_roles_role_idx on public.user_roles(role);
create index if not exists project_access_user_idx on public.user_project_access(user_id);
create index if not exists user_project_access_project_idx on public.user_project_access(project_key);
