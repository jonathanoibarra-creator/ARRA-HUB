create index if not exists hub_work_items_created_by_idx
  on public.hub_work_items (created_by);

create index if not exists hub_project_links_created_by_idx
  on public.hub_project_links (created_by);
