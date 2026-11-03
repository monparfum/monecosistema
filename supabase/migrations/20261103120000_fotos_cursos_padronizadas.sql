-- Fotos novas dos cursos (aprovadas em "Imagens do novo site MON", 19/10/2026).
-- As antigas mostravam a embalagem do kit que saiu de linha. Arquivos em public/img/cursos (WebP leve).
-- Jasmim: ver final do arquivo.
UPDATE public.products p
SET image_url = '/img/cursos/' || v.slug || '.webp'
FROM (VALUES
  ('introducao-a-perfumaria'),
  ('diluicao-aspectos-praticos'),
  ('madeiras-na-composicao'),
  ('neroli-e-flor-de-laranjeira'),
  ('baunilhas-na-perfumaria'),
  ('mimosa-a-luz-dourada-da-perfumaria'),
  ('rosa-a-rainha-da-perfumaria'),
  ('familias-olfativas-novas-construcoes'),
  ('curso-velas-perfumadas-online'),
  ('curso-marketing-olfativo-cheiro-emocao-comportamento'),
  ('aspectos-legais-e-regulatorios')
) AS v(slug)
WHERE p.slug = v.slug;

-- Jasmim: provisório recortado do PDF (já com título), até chegar a foto sem texto.
UPDATE public.products SET image_url = '/img/cursos-card/os-segredos-do-jasmim.webp' WHERE slug = 'os-segredos-do-jasmim';
