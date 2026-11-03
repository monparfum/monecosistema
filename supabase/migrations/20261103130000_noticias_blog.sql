-- Notícias e Blog: publicações separadas por tipo, cada tipo com suas categorias.
-- Público lê só o que está publicado (status + data); equipe do Estúdio edita tudo.

CREATE TABLE IF NOT EXISTS public.post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('noticia', 'blog')),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,80}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description text CHECK (char_length(description) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, slug)
);

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('noticia', 'blog')),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9-]{1,120}$'),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  excerpt text CHECK (char_length(excerpt) <= 400),
  content text NOT NULL DEFAULT '' CHECK (char_length(content) <= 100000),
  cover_url text,
  cover_alt text CHECK (char_length(cover_alt) <= 200),
  category_id uuid REFERENCES public.post_categories(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  author text CHECK (char_length(author) <= 120),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
  published_at timestamptz,
  seo_title text CHECK (char_length(seo_title) <= 70),
  seo_description text CHECK (char_length(seo_description) <= 170),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE (kind, slug)
);
CREATE INDEX IF NOT EXISTS posts_public_idx ON public.posts (kind, status, published_at DESC);

-- Publicar sem data = publicar agora; updated_at sempre atualizado
CREATE OR REPLACE FUNCTION public.posts_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'publicado' AND NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS posts_touch ON public.posts;
CREATE TRIGGER posts_touch BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.posts_touch();

GRANT SELECT ON public.post_categories, public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.post_categories, public.posts TO authenticated;
GRANT ALL ON public.post_categories, public.posts TO service_role;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias são públicas" ON public.post_categories FOR SELECT USING (true);
CREATE POLICY "Equipe edita categorias" ON public.post_categories FOR ALL
  USING (public.has_studio_access(auth.uid())) WITH CHECK (public.has_studio_access(auth.uid()));

CREATE POLICY "Publicações publicadas são públicas" ON public.posts FOR SELECT
  USING ((status = 'publicado' AND published_at <= now()) OR public.has_studio_access(auth.uid()));
CREATE POLICY "Equipe edita publicações" ON public.posts FOR ALL
  USING (public.has_studio_access(auth.uid())) WITH CHECK (public.has_studio_access(auth.uid()));

-- ---------- Conteúdo de exemplo (fictício, tag "exemplo" — apagar antes de divulgar) ----------
INSERT INTO public.post_categories (kind, slug, name, description) VALUES
  ('noticia', 'institucional', 'Institucional', 'Novidades da MON PARFUM.'),
  ('noticia', 'eventos', 'Eventos', 'Workshops, turmas e encontros.'),
  ('noticia', 'imprensa', 'Imprensa', 'A MON na mídia.'),
  ('blog', 'materias-primas', 'Matérias-primas', 'De onde vêm e como se comportam as notas.'),
  ('blog', 'tecnica', 'Técnica', 'Diluição, acordes e método de criação.'),
  ('blog', 'carreira', 'Carreira', 'Caminhos para quem quer viver de perfumaria.')
ON CONFLICT (kind, slug) DO NOTHING;

INSERT INTO public.posts (kind, slug, title, excerpt, content, cover_url, cover_alt, category_id, tags, author, status, published_at, seo_title, seo_description)
SELECT v.kind, v.slug, v.title, v.excerpt, v.content, v.cover_url, v.cover_alt,
       (SELECT id FROM public.post_categories c WHERE c.kind = v.kind AND c.slug = v.cat),
       v.tags, v.author, 'publicado', v.published_at::timestamptz, v.seo_title, v.seo_description
FROM (VALUES
  ('noticia', 'mon-abre-novas-turmas-de-introducao-a-perfumaria', 'MON abre novas turmas de Introdução à Perfumaria',
   'As inscrições para as turmas de novembro já estão abertas, com kit de matérias-primas enviado para todo o Brasil.',
   E'A MON PARFUM abriu as inscrições para as novas turmas do curso **Introdução à Perfumaria**.\n\n## Como funciona\n\nCada aluno recebe em casa o kit com matérias-primas, fitas olfativas e material de apoio antes da primeira aula.\n\n- Aulas on-line ao vivo, com gravação\n- Kit enviado para todo o Brasil\n- Acesso ao MON Club depois do curso\n\nVeja os detalhes na [página do curso](/cursos/introducao-a-perfumaria).',
   '/img/cursos/introducao-a-perfumaria.webp', 'Aluna sentindo uma fita olfativa', 'eventos', ARRAY['exemplo','cursos','turmas'], 'Equipe MON', '2026-10-28 10:00-03',
   'Novas turmas de Introdução à Perfumaria | MON', 'Inscrições abertas para o curso Introdução à Perfumaria da MON, com kit de matérias-primas em casa e aulas on-line.'),
  ('noticia', 'workshop-corporativo-reune-equipe-em-florianopolis', 'Workshop corporativo reúne equipe em Florianópolis',
   'Cada participante criou o próprio perfume em uma tarde de team building conduzida pela perfumista Daniela Bitelo.',
   E'Uma equipe de 30 pessoas participou do **Ateliê MON Corporativo** em Florianópolis.\n\nDurante a tarde, cada participante compôs a própria fragrância a partir de acordes preparados pela MON.\n\n## O que a empresa levou\n\n- Um perfume único para cada participante\n- Uma memória olfativa do evento\n\nQuer levar para sua empresa? [Solicite uma proposta](/corporativo).',
   '/img/corporativo.webp', 'Participantes criando perfumes em workshop', 'eventos', ARRAY['exemplo','corporativo'], 'Equipe MON', '2026-10-20 09:00-03',
   'Workshop corporativo de perfumaria em Florianópolis | MON', 'Equipe cria o próprio perfume em workshop corporativo da MON PARFUM em Florianópolis.'),
  ('noticia', 'mon-lanca-novo-site', 'MON PARFUM lança novo site com cursos e loja',
   'O novo site reúne cursos, kits, experiências e o MON Club em um só lugar.',
   E'A MON PARFUM está de casa nova na internet.\n\nO site reúne **cursos**, **kits**, **experiências** e o **MON Club**, com compra direta e acompanhamento do pedido.\n\n## Próximos passos\n\nNos próximos meses, novas turmas e conteúdos chegam por aqui — acompanhe as notícias.',
   '/img/hero-desktop.jpg', 'Aluna com o kit MON em casa', 'institucional', ARRAY['exemplo','site'], 'Equipe MON', '2026-10-10 12:00-03',
   'MON PARFUM lança novo site | Notícias MON', 'Novo site da MON PARFUM reúne cursos de perfumaria, kits, experiências e o MON Club.'),
  ('noticia', 'daniela-bitelo-fala-sobre-perfumaria-autoral', 'Daniela Bitelo fala sobre perfumaria autoral no Brasil',
   'A fundadora da MON comenta o crescimento da perfumaria autoral e o acesso à formação técnica.',
   E'Em entrevista, a perfumista **Daniela Bitelo** falou sobre o momento da perfumaria autoral no Brasil.\n\n## Formação mais acessível\n\nSegundo Daniela, o conhecimento técnico ainda circula pouco fora dos grandes laboratórios — e é esse acesso que a MON quer ampliar.',
   '/img/atelier.webp', 'Daniela Bitelo no ateliê MON', 'imprensa', ARRAY['exemplo','imprensa'], 'Equipe MON', '2026-09-30 15:00-03',
   'Daniela Bitelo fala sobre perfumaria autoral | MON', 'A fundadora da MON PARFUM comenta o crescimento da perfumaria autoral e da formação técnica no Brasil.'),
  ('blog', 'o-que-e-diluicao-em-perfumaria', 'O que é diluição em perfumaria e por que ela muda tudo',
   'A mesma matéria-prima pode ter cheiros muito diferentes dependendo da diluição. Entenda o porquê.',
   E'Quem sente uma matéria-prima pura pela primeira vez costuma se surpreender: muitas delas só mostram sua beleza **diluídas**.\n\n## Por que diluir\n\n- Algumas moléculas são intensas demais puras\n- A diluição revela facetas escondidas\n- Facilita pesar e dosar na fórmula\n\n## Na prática\n\nA diluição mais comum para avaliação é 10% em álcool. Aprenda o método completo no [curso de Diluição](/cursos/diluicao-aspectos-praticos).',
   '/img/cursos/diluicao-aspectos-praticos.webp', 'Perfumista diluindo matéria-prima', 'tecnica', ARRAY['exemplo','diluicao','tecnica'], 'Daniela Bitelo', '2026-10-25 08:00-03',
   'O que é diluição em perfumaria | Blog MON', 'Entenda o que é diluição em perfumaria, por que diluir matérias-primas e qual a diluição usada para avaliação.'),
  ('blog', 'baunilha-da-fava-a-formula', 'Baunilha: da fava à fórmula',
   'Da orquídea à molécula de vanilina: como a nota mais amada da perfumaria chega ao seu perfume.',
   E'A baunilha nasce de uma orquídea e leva meses de cura até chegar ao aroma que conhecemos.\n\n## Natural e sintética\n\nA **vanilina** é a principal molécula do aroma, mas a fava natural tem centenas de outros compostos que dão profundidade.\n\n## Como usar\n\n- Fundo de fórmulas gourmand\n- Acordes ambarados\n- Suavizar notas amadeiradas',
   '/img/cursos/baunilhas-na-perfumaria.webp', 'Flor e favas de baunilha', 'materias-primas', ARRAY['exemplo','baunilha','gourmand'], 'Daniela Bitelo', '2026-10-15 08:00-03',
   'Baunilha na perfumaria: da fava à fórmula | Blog MON', 'Conheça a origem da baunilha, a diferença entre vanilina e fava natural e como usá-la na perfumaria.'),
  ('blog', 'como-montar-seu-primeiro-acorde', 'Como montar seu primeiro acorde',
   'Um passo a passo simples para criar um acorde com três matérias-primas.',
   E'Um **acorde** é a combinação de matérias-primas que soa como uma ideia só.\n\n## Passo a passo\n\n- Escolha uma nota principal\n- Adicione uma nota de contraste\n- Equilibre com uma nota de fundo\n- Ajuste as proporções e anote tudo\n\n## Dica\n\nTrabalhe sempre com as matérias-primas diluídas e avalie em fitas olfativas ao longo do tempo.',
   '/img/cursos-topo.webp', 'Aluna anotando fórmula com o kit aberto', 'tecnica', ARRAY['exemplo','acordes'], 'Equipe MON', '2026-10-05 08:00-03',
   'Como montar seu primeiro acorde de perfume | Blog MON', 'Passo a passo para criar seu primeiro acorde de perfumaria com três matérias-primas.'),
  ('blog', 'como-comecar-carreira-em-perfumaria', 'Como começar uma carreira em perfumaria',
   'Formação, prática e repertório olfativo: os primeiros passos de quem quer viver de perfume.',
   E'A perfumaria tem muitos caminhos: criação, avaliação, marketing olfativo, velas e cosméticos.\n\n## Por onde começar\n\n- Construa repertório sentindo matérias-primas todos os dias\n- Estude famílias olfativas\n- Pratique fórmulas e registre tudo\n\nConheça os [cursos da MON](/cursos) para cada momento do seu nariz.',
   '/img/cursos/familias-olfativas-novas-construcoes.webp', 'Perfumista estudando na bancada', 'carreira', ARRAY['exemplo','carreira'], 'Equipe MON', '2026-09-20 08:00-03',
   'Como começar uma carreira em perfumaria | Blog MON', 'Primeiros passos para quem quer trabalhar com perfumaria: formação, prática e repertório olfativo.')
) AS v(kind, slug, title, excerpt, content, cover_url, cover_alt, cat, tags, author, published_at, seo_title, seo_description)
ON CONFLICT (kind, slug) DO NOTHING;
