-- Atualização do catálogo: produtos híbridos e novos cursos conectados à área de membros

INSERT INTO public.products (slug, name, brand, description, price_cents, compare_at_cents, stock, delivery_type, active, category_id, image_url)
SELECT v.slug, v.name, 'MON PARFUM', v.description, v.price_cents, v.compare_at_cents, v.stock, v.delivery_type::public.product_delivery, v.active,
       (SELECT id FROM public.categories c WHERE c.slug = v.cat), v.image_url
FROM (VALUES
  ('curso-marketing-olfativo-cheiro-emocao-comportamento', 'Curso de Marketing Olfativo: Cheiro, Emoção e Comportamento', 'Descubra como o cheiro participa da construção da experiência de uma marca. Aula on-line com prática sensorial, kit com 10 fragrâncias e fundamentos de marketing olfativo.', 59800, NULL::int, 30, 'hybrid', true, 'cursos', '/products/marketing-olfativo.png'),
  ('curso-velas-perfumadas-online', 'Curso de Velas Perfumadas: Fragrância e Performance', 'Um curso técnico e sensorial para compreender como fragrância, cera, pavio e calor trabalham juntos em uma vela perfumada. Kit sensorial incluso.', 66829, NULL::int, 30, 'hybrid', true, 'cursos', '/products/velas-perfumadas.png')
) AS v(slug, name, description, price_cents, compare_at_cents, stock, delivery_type, active, cat, image_url)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  delivery_type = EXCLUDED.delivery_type,
  active = EXCLUDED.active,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url;

-- Atualizar preços, tipo de entrega e imagens dos produtos existentes
UPDATE public.products SET
  delivery_type = 'hybrid',
  price_cents = 110990,
  active = true,
  image_url = '/products/baunilha-fava-formula.jpeg'
WHERE slug = 'baunilhas-na-perfumaria';

UPDATE public.products SET
  delivery_type = 'hybrid',
  price_cents = 41500,
  active = true,
  image_url = '/products/aspectos-legais.png'
WHERE slug = 'aspectos-legais-e-regulatorios';

UPDATE public.products SET
  delivery_type = 'hybrid',
  price_cents = 119000,
  active = true,
  image_url = '/products/diluicao-perfumaria.png'
WHERE slug = 'diluicao-aspectos-praticos';

UPDATE public.products SET
  delivery_type = 'hybrid',
  price_cents = 135990,
  active = true,
  image_url = '/products/madeiras-composicao.png'
WHERE slug = 'madeiras-na-composicao';

UPDATE public.products SET
  delivery_type = 'hybrid',
  price_cents = 54750,
  compare_at_cents = 58990,
  active = true,
  image_url = '/products/curiosidades-perfumaria.png'
WHERE slug = 'curiosidades-da-perfumaria';

UPDATE public.products SET
  delivery_type = 'hybrid',
  price_cents = 64590,
  compare_at_cents = 68990,
  active = true,
  image_url = '/products/gourmand-sensorial.png'
WHERE slug = 'kit-gourmand';
