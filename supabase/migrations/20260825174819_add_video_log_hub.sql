-- Searchable, shared archive for ARRA Studios and Squatch Media video work.

create table public.hub_video_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null default 'arra-squatch',
  title text not null check (char_length(title) between 1 and 300),
  brand text not null check (brand in ('ARRA', 'SQUATCH')),
  client_name text not null check (char_length(client_name) between 1 and 200),
  project_key text not null check (char_length(project_key) between 1 and 200),
  video_type text not null check (video_type in ('Social video', 'Commercial', 'Interview', 'Testimonial', 'Wedding film', 'Event', 'Behind the scenes', 'Other')),
  status text not null default 'planned' check (status in ('planned', 'shot', 'editing', 'review', 'published', 'archived')),
  shoot_date date not null default current_date,
  location_name text not null check (char_length(location_name) between 1 and 300),
  location_address text,
  producer_name text not null default 'Jonathan Ibarra',
  subjects text,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1440),
  video_url text check (video_url is null or video_url ~* '^https?://'),
  review_url text check (review_url is null or review_url ~* '^https?://'),
  raw_footage_url text check (raw_footage_url is null or raw_footage_url ~* '^https?://'),
  tags text[] not null default '{}',
  notes text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hub_video_logs_project_idx
  on public.hub_video_logs (project_key);
create index hub_video_logs_created_by_idx
  on public.hub_video_logs (created_by);
create index hub_video_logs_shoot_date_idx
  on public.hub_video_logs (shoot_date desc);
create index hub_video_logs_status_date_idx
  on public.hub_video_logs (status, shoot_date desc);
create index hub_video_logs_brand_date_idx
  on public.hub_video_logs (brand, shoot_date desc);

create trigger touch_hub_video_logs
before update on public.hub_video_logs
for each row execute procedure private.touch_hub_updated_at();

alter table public.hub_video_logs enable row level security;

create policy "hub video logs are visible by project"
on public.hub_video_logs for select to authenticated
using ((select private.can_access_hub_project(project_key)));

create policy "hub video logs can be created by editors"
on public.hub_video_logs for insert to authenticated
with check ((select private.can_edit_hub_project(project_key)));

create policy "hub video logs can be updated by editors"
on public.hub_video_logs for update to authenticated
using ((select private.can_edit_hub_project(project_key)))
with check ((select private.can_edit_hub_project(project_key)));

create policy "hub video logs can be deleted by editors"
on public.hub_video_logs for delete to authenticated
using ((select private.can_edit_hub_project(project_key)));

revoke all on public.hub_video_logs from anon;
grant select, insert, update, delete on public.hub_video_logs to authenticated;

insert into public.hub_video_logs
  (title, brand, client_name, project_key, video_type, status, shoot_date, location_name, producer_name, subjects, tags, notes)
select *
from (values
  ('Liz & Junior Wedding Film', 'ARRA', 'Liz & Junior', 'Wedding film', 'Wedding film', 'editing', date '2026-08-15', 'Los Angeles, CA', 'Jonathan Ibarra', 'Liz & Junior', array['wedding', 'highlight'], 'Wedding film edit and highlight archive.'),
  ('Furniture City Showroom Campaign', 'SQUATCH', 'Furniture City', 'Social video', 'Commercial', 'review', date '2026-08-16', 'Furniture City Showroom', 'Jonathan Ibarra', 'Furniture City team', array['showroom', 'campaign'], 'Short-form showroom campaign ready for client review.'),
  ('Dr. Gabbay Interview Session', 'SQUATCH', 'Dr. Gabbay', 'Video shoot', 'Interview', 'shot', date '2026-08-18', 'Dr. Gabbay Office', 'Jonathan Ibarra', 'Dr. Gabbay', array['interview', 'medical'], 'Interview footage captured for the content library.'),
  ('Dr. Tehrani Daily Video Batch', 'SQUATCH', 'Dr. Tehrani', 'Daily video content', 'Social video', 'editing', date '2026-08-24', 'Dr. Tehrani Office', 'Jonathan Ibarra', 'Dr. Tehrani', array['daily-content', 'social'], 'Daily short-form video batch in post-production.')
) as seed(title, brand, client_name, project_key, video_type, status, shoot_date, location_name, producer_name, subjects, tags, notes)
where not exists (
  select 1
  from public.hub_video_logs existing
  where existing.title = seed.title
    and existing.project_key = seed.project_key
    and existing.shoot_date = seed.shoot_date
);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'hub_video_logs'
    ) then
    alter publication supabase_realtime add table public.hub_video_logs;
  end if;
end;
$$;
