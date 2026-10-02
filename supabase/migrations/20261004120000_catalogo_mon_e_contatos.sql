-- Catálogo da cópia MON (cursos, kits, edições limitadas) + formulários do site (contatos/leads)

-- Preço "de" (riscado) para promoções
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_cents int CHECK (compare_at_cents IS NULL OR compare_at_cents >= 0);

-- Categorias
INSERT INTO public.categories (slug, name, description) VALUES
  ('cursos', 'Cursos', 'Formações com kit enviado ao aluno'),
  ('kits-criacao', 'Kits de criação', 'Kit MON com vídeo-guia para criar seu perfume'),
  ('kits-treinamento', 'Kits de treinamento olfativo', 'Repertório olfativo com método'),
  ('edicoes-limitadas', 'Edições limitadas', 'Criações autorais produzidas uma única vez')
ON CONFLICT (slug) DO NOTHING;

-- Produtos. Cursos e Kits MON são híbridos (kit físico + acesso online): ficam INATIVOS até
-- o admin vincular o curso da área de membros e conferir preço/estoque. Sem preço na cópia => inativo.
INSERT INTO public.products (slug, name, brand, description, price_cents, compare_at_cents, stock, delivery_type, active, category_id)
SELECT v.slug, v.name, 'MON PARFUM', v.description, v.price_cents, v.compare_at_cents, v.stock, v.delivery_type::public.product_delivery, v.active,
       (SELECT id FROM public.categories c WHERE c.slug = v.cat)
FROM (VALUES
  ('introducao-a-perfumaria', 'Introdução à Perfumaria', 'Leia uma fórmula, cheire com método e crie sua primeira composição.', 69990, NULL::int, 30, 'hybrid', false, 'cursos'),
  ('baunilhas-na-perfumaria', 'Baunilhas na Perfumaria: da Fava à Fórmula', 'Domine a nota mais amada da perfumaria — da fava à fórmula.', 78989, NULL, 30, 'hybrid', false, 'cursos'),
  ('yes-nos-tambem-temos-banana', 'Yes, nós também temos banana', 'Explore uma nota inesperada na perfumaria e crie com ela.', 68990, NULL, 30, 'hybrid', false, 'cursos'),
  ('aspectos-legais-e-regulatorios', 'Perfumaria: Aspectos Legais e Regulatórios', 'Saiba o que a lei exige para vender perfume no Brasil.', 41500, NULL, 30, 'hybrid', false, 'cursos'),
  ('diluicao-aspectos-praticos', 'Diluição: Aspectos Práticos do Dia a Dia', 'Pare de perder material com turvamento e separação de fases.', 79990, NULL, 30, 'hybrid', false, 'cursos'),
  ('madeiras-na-composicao', 'Madeiras na Composição: do Acorde à Fragrância', 'Domine as madeiras da perfumaria e construa acordes com estrutura.', 135990, NULL, 30, 'hybrid', false, 'cursos'),
  ('os-segredos-do-jasmim', 'Os Segredos do Jasmim', 'Diferencie Sambac de Grandiflorum e monte acordes florais sofisticados.', 78989, NULL, 30, 'hybrid', false, 'cursos'),
  ('neroli-e-flor-de-laranjeira', 'Néroli & Flor de Laranjeira', 'Domine uma das flores mais versáteis da perfumaria.', 78989, NULL, 30, 'hybrid', false, 'cursos'),
  ('kit-mon-jardin', 'Kit MON JARDIN', 'Território floral, frutado e verde.', 0, NULL, 0, 'hybrid', false, 'kits-criacao'),
  ('kit-mon-bois', 'Kit MON BOIS', 'Território amadeirado, resinoso e terroso.', 0, NULL, 0, 'hybrid', false, 'kits-criacao'),
  ('meu-primeiro-kit', 'Meu Primeiro Kit', 'O ponto de partida na perfumaria.', 44790, 48990, 20, 'physical', true, 'kits-treinamento'),
  ('curiosidades-da-perfumaria', 'Curiosidades da Perfumaria', 'Matérias-primas que surpreendem e exercícios que ampliam o repertório.', 54750, 58990, 20, 'physical', true, 'kits-treinamento'),
  ('kit-gourmand', 'Kit Gourmand', 'Baunilha, cacau, caramelo, especiarias doces.', 64590, 68990, 20, 'physical', true, 'kits-treinamento'),
  ('magnetique', 'Magnetique', 'Presença, profundidade e rastro. Edição limitada.', 0, NULL, 75, 'physical', false, 'edicoes-limitadas'),
  ('heritage', 'Heritage', 'Raiz, identidade e sofisticação. Edição limitada.', 0, NULL, 75, 'physical', false, 'edicoes-limitadas')
) AS v(slug, name, description, price_cents, compare_at_cents, stock, delivery_type, active, cat)
ON CONFLICT (slug) DO NOTHING;

-- Contatos vindos do site (quiz, atelier privé, corporativo, contato, newsletter)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('quiz', 'atelier', 'corporativo', 'contato', 'newsletter')),
  name text CHECK (char_length(name) <= 120),
  email text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 200),
  phone text CHECK (char_length(phone) <= 40),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(payload) <= 8000),
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_contato', 'concluido')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON public.leads(created_at DESC);
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site envia contatos" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (status = 'novo');
CREATE POLICY "Admins leem contatos" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins atualizam contatos" ON public.leads FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins apagam contatos" ON public.leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
