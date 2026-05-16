
create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null,
  label text,
  title text not null,
  seo_title text,
  seo_description text,
  blocks_snapshot jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index idx_page_versions_page on public.page_versions(page_id, created_at desc);

alter table public.page_versions enable row level security;

create policy "Admins manage versions" on public.page_versions
for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
