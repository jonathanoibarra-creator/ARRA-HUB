create schema if not exists extensions;
alter extension citext set schema extensions;
create index if not exists user_roles_created_by_idx on public.user_roles(created_by);
