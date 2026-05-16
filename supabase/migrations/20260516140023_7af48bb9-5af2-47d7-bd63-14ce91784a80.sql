
-- Pages
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pages enable row level security;

create policy "Published pages are public"
  on public.pages for select
  using (status = 'published' or has_role(auth.uid(), 'admin'));

create policy "Admins manage pages"
  on public.pages for all
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- Page blocks
create table public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index page_blocks_page_id_position_idx on public.page_blocks(page_id, position);

alter table public.page_blocks enable row level security;

create policy "Blocks of published pages are public"
  on public.page_blocks for select
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_blocks.page_id
      and (p.status = 'published' or has_role(auth.uid(), 'admin'))
    )
  );

create policy "Admins manage blocks"
  on public.page_blocks for all
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

create trigger page_blocks_set_updated_at
  before update on public.page_blocks
  for each row execute function public.set_updated_at();

-- Media assets
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  filename text not null,
  mime_type text,
  width integer,
  height integer,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

alter table public.media_assets enable row level security;

create policy "Media is public"
  on public.media_assets for select
  using (true);

create policy "Admins manage media"
  on public.media_assets for all
  using (has_role(auth.uid(), 'admin'))
  with check (has_role(auth.uid(), 'admin'));

-- Seed pages
insert into public.pages (slug, title, status, seo_title, seo_description) values
  ('home', 'Home', 'published', 'Mon Parfum — Maison olfativa contemporânea', 'Uma maison olfativa premium. Experiências, workshops, cursos e edições autorais.'),
  ('sobre', 'Sobre', 'published', 'Sobre — Mon Parfum', 'A história e o manifesto da Mon Parfum.'),
  ('experiencias', 'Experiências', 'published', 'Experiências — Mon Parfum', 'Experiências sensoriais autorais.'),
  ('workshops', 'Workshops', 'published', 'Workshops — Mon Parfum', 'Workshops de perfumaria autoral.'),
  ('produtos', 'Produtos', 'published', 'Produtos — Mon Parfum', 'A coleção Mon Parfum.'),
  ('cursos', 'Cursos', 'published', 'Cursos — Mon Parfum', 'Educação olfativa.'),
  ('comunidade', 'Comunidade', 'published', 'Comunidade — Mon Parfum', 'A comunidade Mon Parfum.'),
  ('ebooks', 'Ebooks', 'published', 'Ebooks — Mon Parfum', 'Edições e guias.'),
  ('corporativo', 'Corporativo', 'draft', 'Corporativo — Mon Parfum', 'Mon Parfum para empresas.');

-- Seed home blocks
with home as (select id from public.pages where slug = 'home')
insert into public.page_blocks (page_id, type, position, content)
select home.id, t.type, t.position, t.content::jsonb from home, (values
  ('hero', 0, '{"eyebrow":"Édition Nº 01 — Maison Mon Parfum","title":"L''art de sentir, lentement.","subtitle":"Uma maison olfativa contemporânea entre o gesto editorial e a perfumaria autoral.","ctaLabel":"Découvrir les expériences","ctaHref":"/experiencias","image":"/src/assets/editorial-hero.jpg"}'),
  ('text', 1, '{"eyebrow":"Manifesto","body":"Acreditamos que o perfume é a forma mais íntima de escrita. Cada edição Mon Parfum nasce de uma narrativa — uma viagem, um silêncio, um encontro. Não há pressa. Há matéria, tempo e atenção."}'),
  ('grid', 2, '{"eyebrow":"Chapitres","items":[{"title":"Experiências","subtitle":"Imersões sensoriais","href":"/experiencias","image":"/src/assets/editorial-experiencias.jpg"},{"title":"Workshops","subtitle":"Perfumaria autoral","href":"/workshops","image":"/src/assets/editorial-workshops.jpg"},{"title":"Cursos","subtitle":"Educação olfativa","href":"/cursos","image":"/src/assets/editorial-cursos.jpg"}]}'),
  ('featured_products', 3, '{"eyebrow":"La Collection","title":"Edições autorais","limit":3}'),
  ('cta', 4, '{"eyebrow":"L''Univers","title":"Entre na Maison.","body":"Receba edições, convites e bastidores da Mon Parfum.","ctaLabel":"Faire partie","ctaHref":"/cadastro"}')
) as t(type, position, content);

-- Seed sobre blocks
with sobre as (select id from public.pages where slug = 'sobre')
insert into public.page_blocks (page_id, type, position, content)
select sobre.id, t.type, t.position, t.content::jsonb from sobre, (values
  ('hero', 0, '{"eyebrow":"La Maison","title":"Uma maison olfativa contemporânea.","subtitle":"Entre São Paulo e Paris, escrevemos perfumes como quem escreve cartas.","image":"/src/assets/editorial-hero.jpg"}'),
  ('text', 1, '{"eyebrow":"Histoire","body":"A Mon Parfum nasceu do desejo de uma perfumaria que não obedecesse ao tempo do mercado, mas ao tempo da matéria. Cada edição é desenhada lentamente, com matérias-primas raras e gestos artesanais."}'),
  ('image_text', 2, '{"image":"/src/assets/editorial-experiencias.jpg","eyebrow":"Filosofia","title":"O perfume como escrita íntima.","body":"Trabalhamos com narrativa antes do acorde. Cada fragrância carrega uma cena — não para descrever, mas para evocar."}'),
  ('cta', 3, '{"eyebrow":"Rejoindre","title":"Faça parte da Maison.","body":"Cadastre-se para receber novas edições e convites privados.","ctaLabel":"Cadastrar","ctaHref":"/cadastro"}')
) as t(type, position, content);
