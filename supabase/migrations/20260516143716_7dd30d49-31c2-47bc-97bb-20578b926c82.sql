-- Seed Experiências
WITH p AS (
  INSERT INTO public.pages (slug, title, status, seo_title, seo_description)
  VALUES ('experiencias', 'Experiências', 'published',
    'Experiências — Mon Parfum',
    'Jornadas olfativas privadas, perfumagem à medida e imersões sensoriais.')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO public.page_blocks (page_id, type, position, content)
SELECT p.id, t.type, t.position, t.content::jsonb FROM p, (VALUES
  ('banner', 0, '{"eyebrow":"Capítulo II","title":"Experiências sensoriais","body":"Jornadas íntimas em nossos ateliês de São Paulo e Paris. Cada experiência é desenhada como um pequeno teatro do olfato — luz, matéria, gesto e silêncio.","image":"/src/assets/editorial-experiencias.jpg","ctaLabel":"","ctaHref":""}'),
  ('cards_list', 1, '{"eyebrow":"La Collection","columns":2,"items":[
    {"eyebrow":"2h","title":"Jornada olfativa privada","body":"Imersão guiada por um perfumista, com leitura sensorial das famílias e descoberta do seu perfil olfativo.","meta":"R$ 1.200","ctaLabel":"Reservar","ctaHref":"/sobre"},
    {"eyebrow":"4h em duas sessões","title":"Perfumagem à medida","body":"Composição autoral de um perfume exclusivo, do briefing à entrega do flacon numerado.","meta":"R$ 4.800","ctaLabel":"Reservar","ctaHref":"/sobre"},
    {"eyebrow":"1h30","title":"Degustação cega","body":"Exploração às cegas de matérias-primas raras e construções de assinatura.","meta":"R$ 680","ctaLabel":"Reservar","ctaHref":"/sobre"},
    {"eyebrow":"1h","title":"Cerimônia do incenso","body":"Ritual contemplativo com madeiras, resinas e incensos preciosos.","meta":"R$ 420","ctaLabel":"Reservar","ctaHref":"/sobre"}
  ]}')
) AS t(type, position, content)
ON CONFLICT DO NOTHING;

-- Seed Workshops
WITH p AS (
  INSERT INTO public.pages (slug, title, status, seo_title, seo_description)
  VALUES ('workshops', 'Workshops', 'published',
    'Workshops corporativos — Mon Parfum',
    'Team building sensorial, branding olfativo e experiências premium para empresas.')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO public.page_blocks (page_id, type, position, content)
SELECT p.id, t.type, t.position, t.content::jsonb FROM p, (VALUES
  ('banner', 0, '{"eyebrow":"Capítulo III","title":"Workshops corporativos","body":"Construímos experiências olfativas sob medida para empresas que entendem o valor do sensorial como ferramenta de cultura, marca e relacionamento.","image":"/src/assets/editorial-workshops.jpg","ctaLabel":"Solicitar proposta","ctaHref":"/sobre","reverse":true}'),
  ('cards_list', 1, '{"eyebrow":"Formatos","columns":2,"items":[
    {"eyebrow":"10 – 40 pessoas","title":"Team building olfativo","body":"Dinâmica colaborativa de composição em torno de uma narrativa de marca."},
    {"eyebrow":"Projeto sob medida","title":"Branding olfativo","body":"Concepção de assinatura olfativa para espaços corporativos, hotelaria e varejo."},
    {"eyebrow":"Eventos premium","title":"Lançamento sensorial","body":"Curadoria e cenografia olfativa para ativações de marca e premieres."},
    {"eyebrow":"C-level / boards","title":"Workshop executivo","body":"Encontro privado conduzido por nosso perfumista-chefe."}
  ]}'),
  ('quote', 2, '{"body":"Trabalhamos com marcas que querem ser sentidas, não apenas vistas.","attribution":"Laure Beaumont · Perfumista-chefe"}')
) AS t(type, position, content)
ON CONFLICT DO NOTHING;

-- Seed Cursos
WITH p AS (
  INSERT INTO public.pages (slug, title, status, seo_title, seo_description)
  VALUES ('cursos', 'Cursos', 'published',
    'Cursos — Mon Parfum',
    'Educação premium em perfumaria, da iniciação à composição autoral.')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO public.page_blocks (page_id, type, position, content)
SELECT p.id, t.type, t.position, t.content::jsonb FROM p, (VALUES
  ('banner', 0, '{"eyebrow":"Capítulo V","title":"Cursos de perfumaria","body":"Uma escola editorial dentro da maison. Programas pensados como rituais de aprendizado — pequenos grupos, matérias-primas reais, leitura intensa.","image":"/src/assets/editorial-cursos.jpg"}'),
  ('cards_list', 1, '{"eyebrow":"Programas","columns":2,"items":[
    {"eyebrow":"Programa I · 6 semanas","title":"Iniciação olfativa","body":"Famílias, acordes e a gramática do perfume contemporâneo.","ctaLabel":"Lista de espera","ctaHref":"/sobre"},
    {"eyebrow":"Programa II · 12 semanas","title":"Composição autoral","body":"Da ideia ao flacon. Você sai com sua primeira composição original.","ctaLabel":"Lista de espera","ctaHref":"/sobre"},
    {"eyebrow":"Avançado · 4 semanas intensivas","title":"Matérias-primas raras","body":"Estudo profundo de absolutos, resinas, animálicos sintéticos e novas moléculas.","ctaLabel":"Lista de espera","ctaHref":"/sobre"},
    {"eyebrow":"Por convite · 6 meses","title":"Residência Mon Parfum","body":"Residência ao lado do nosso perfumista-chefe em ateliê privado.","ctaLabel":"Lista de espera","ctaHref":"/sobre"}
  ]}')
) AS t(type, position, content)
ON CONFLICT DO NOTHING;

-- Seed Comunidade
WITH p AS (
  INSERT INTO public.pages (slug, title, status, seo_title, seo_description)
  VALUES ('comunidade', 'Comunidade', 'published',
    'Comunidade — Mon Parfum',
    'Encontros, clube olfativo e círculos privados de discussão.')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO public.page_blocks (page_id, type, position, content)
SELECT p.id, t.type, t.position, t.content::jsonb FROM p, (VALUES
  ('text', 0, '{"eyebrow":"Capítulo VI","body":"Um círculo silencioso de pessoas que tratam o perfume como linguagem. Encontros, leituras e descobertas compartilhadas em uma cadência editorial."}'),
  ('text_columns', 1, '{"columns":3,"items":[
    {"title":"Le Cercle","body":"Clube privado de assinaturas trimestrais com edições exclusivas."},
    {"title":"Encontros","body":"Saraus olfativos mensais em São Paulo, Paris e Lisboa."},
    {"title":"Diário","body":"Cartas editoriais sobre famílias, perfumistas e matérias-primas."}
  ]}'),
  ('newsletter', 2, '{"title":"Receba o diário Mon Parfum — uma carta editorial, uma vez por mês.","placeholder":"seu e-mail","ctaLabel":"Assinar"}')
) AS t(type, position, content)
ON CONFLICT DO NOTHING;

-- Seed Ebooks
WITH p AS (
  INSERT INTO public.pages (slug, title, status, seo_title, seo_description)
  VALUES ('ebooks', 'Ebooks', 'published',
    'Ebooks — Mon Parfum',
    'Publicações editoriais sobre perfumaria, matérias-primas e famílias olfativas.')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title RETURNING id
)
INSERT INTO public.page_blocks (page_id, type, position, content)
SELECT p.id, t.type, t.position, t.content::jsonb FROM p, (VALUES
  ('text', 0, '{"eyebrow":"Edições Mon Parfum","body":"Uma pequena editora dentro da maison. Publicações breves, ilustradas e pensadas para serem lidas com tempo."}'),
  ('cards_list', 1, '{"columns":2,"items":[
    {"eyebrow":"Volume 01 · 128 páginas","title":"O Vocabulário do Olfato","body":"Pequeno tratado sobre as famílias olfativas contemporâneas, ilustrado.","ctaLabel":"Download (PDF)","ctaHref":"#"},
    {"eyebrow":"Volume 02 · 96 páginas","title":"Matérias Vivas","body":"Ensaios sobre absolutos, resinas e o tempo das matérias-primas naturais.","ctaLabel":"Download (PDF)","ctaHref":"#"},
    {"eyebrow":"Volume 03 · 144 páginas","title":"Perfume e Memória","body":"Um percurso entre neurociência, literatura e prática perfumista.","ctaLabel":"Download (PDF)","ctaHref":"#"},
    {"eyebrow":"Volume 04 · Edição limitada","title":"Atelier","body":"Diário visual do nosso ateliê parisiense, em papel algodão.","ctaLabel":"Download (PDF)","ctaHref":"#"}
  ]}')
) AS t(type, position, content)
ON CONFLICT DO NOTHING;