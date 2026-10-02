-- Painel de conteúdo: textos/fotos de cada página (site_content) + conteúdo editorial de cursos/kits (products.details)

-- 1) Conteúdo das páginas: uma linha por página, só os campos alterados (o resto usa o padrão do código)
CREATE TABLE IF NOT EXISTS public.site_content (
  page text PRIMARY KEY CHECK (page ~ '^[a-z0-9-]{1,40}$'),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(data) <= 200000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conteúdo do site é público" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Equipe edita conteúdo" ON public.site_content FOR ALL
  USING (public.has_studio_access(auth.uid())) WITH CHECK (public.has_studio_access(auth.uid()));

-- 2) Produto: conteúdo da página (curso/kit) e "em breve" (aparece no site, não vende)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;

-- Bloqueio no banco: item "em breve" nunca entra num pedido
CREATE OR REPLACE FUNCTION public.check_sellable_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.products WHERE id = NEW.product_id AND (coming_soon OR price_cents <= 0)) THEN
    RAISE EXCEPTION 'Produto ainda não disponível para compra';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS order_items_sellable_trg ON public.order_items;
CREATE TRIGGER order_items_sellable_trg BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.check_sellable_item();

-- 3) Conteúdo editorial dos produtos da cópia (cursos/kits). Cursos e kits sem preço ficam visíveis como "em breve".
UPDATE public.products p SET details = v.details::jsonb, active = true, coming_soon = v.soon
FROM (VALUES
  ('introducao-a-perfumaria', true, '{"kind":"curso","estagio":"Iniciante","formato":"Online","nota":"9,6","badge":"Mais procurado","destaque":true,"turma":"14 de novembro de 2026","dor":"Você gosta de perfume, mas não sabe como um é construído","sub":"Aprenda a ler uma fórmula, cheirar com método e criar sua primeira composição.","aprende":"Reconhecer matérias-primas naturais e sintéticas pelo cheiro\nEntender a lógica de topo, coração e fundo\nLer e interpretar uma fórmula\nCriar sua primeira composição autoral","prereq":"Nenhum","naoE":"você já compõe acordes com método. Nesse caso, avance para os cursos de matéria-prima."}'),
  ('baunilhas-na-perfumaria', true, '{"kind":"curso","estagio":"Intermediário","formato":"Online","nota":"9,5","badge":"Novo","destaque":true,"turma":"Em breve","dor":"Baunilha não é uma nota só — são dezenas de moléculas e possibilidades","sub":"Da fava de baunilha natural às moléculas sintéticas que a recriam. Construa acordes e fórmulas com profundidade gourmand.","aprende":"Conhecer os tipos de baunilha e suas moléculas\nDiferenciar vanilina, etilvanilina e absoluto de baunilha\nConstruir acordes gourmand com baunilha\nCriar fórmulas autorais com diferentes faces da baunilha","prereq":"Introdução à Perfumaria ou equivalente","naoE":"você nunca cheirou uma matéria-prima isolada."}'),
  ('yes-nos-tambem-temos-banana', true, '{"kind":"curso","estagio":"Intermediário","formato":"Online","nota":"9,3","badge":"Novo","turma":"Em breve","dor":"Nota de banana na perfumaria? Muito mais do que você imagina","sub":"Síntese, acorde e fragrâncias com nota de banana — um território surpreendente e pouco explorado.","aprende":"Entender a síntese da nota de banana na perfumaria\nConhecer moléculas frutadas e suas aplicações\nConstruir acordes com nota de banana\nCriar fórmulas autorais com territórios frutados","prereq":"Introdução à Perfumaria ou equivalente","naoE":"você está começando do zero."}'),
  ('aspectos-legais-e-regulatorios', true, '{"kind":"curso","estagio":"Avançado","formato":"Online","nota":"9,8","turma":"Em breve","dor":"Você quer vender o que cria e não sabe se pode","sub":"Entenda o que a legislação e a ANVISA exigem de quem quer comercializar perfumes.","aprende":"Entender o que a legislação brasileira estabelece\nIdentificar o papel da ANVISA e das Vigilâncias Sanitárias\nReconhecer limites de alérgenos e exigências de rotulagem\nMapear o que falta para vender dentro da lei","prereq":"Nenhum","naoE":"você não pretende comercializar o que cria."}'),
  ('diluicao-aspectos-praticos', true, '{"kind":"curso","estagio":"Avançado","formato":"Online","nota":"9,7","turma":"Em breve","dor":"Sua fórmula turvou e você não sabe por quê","sub":"Solubilidade, precipitação e separação de fases — pare de perder material.","aprende":"Diagnosticar turvamento, precipitação e separação de fases\nEscolher o solvente certo para cada matéria-prima\nDiluir pó, líquido e resina com segurança\nCorrigir uma fórmula instável","prereq":"Prática prévia de composição","naoE":"você ainda não criou nenhuma fórmula própria."}'),
  ('madeiras-na-composicao', true, '{"kind":"curso","estagio":"Intermediário","formato":"Online","nota":"9,4","badge":"Aguardar novas datas","turma":"Em breve","dor":"Você usa madeiras na fórmula mas não domina as diferenças entre elas","sub":"Sândalo, cedro, vetiver, patchouli — cada madeira tem uma função. Aprenda a usá-las com método.","aprende":"Reconhecer as principais madeiras da perfumaria no cheiro\nEntender a função estrutural das madeiras numa composição\nConstruir acordes amadeirados com diferentes perfis\nCriar fórmulas autorais com base em madeiras","prereq":"Introdução à Perfumaria ou equivalente","naoE":"você está começando do zero."}'),
  ('os-segredos-do-jasmim', true, '{"kind":"curso","estagio":"Intermediário","formato":"Online","nota":"9,4","destaque":true,"turma":"Em breve","dor":"Você usa jasmim nas suas fórmulas — mas não sabe qual","sub":"Diferencie Sambac de Grandiflorum no cheiro e monte seu acorde floral.","aprende":"Diferenciar Sambac de Grandiflorum no cheiro\nCompreender o papel do indol em acordes florais\nConstruir um acorde floral branco\nCriar sua própria fórmula floral","prereq":"Introdução à Perfumaria ou equivalente","naoE":"você nunca cheirou uma matéria-prima isolada."}'),
  ('neroli-e-flor-de-laranjeira', true, '{"kind":"curso","estagio":"Intermediário","formato":"Online","nota":"9,5","turma":"Em breve","dor":"Duas flores da mesma árvore, dois cheiros completamente diferentes","sub":"Entenda a diferença e crie um acorde com as duas.","aprende":"Distinguir néroli, petitgrain e absoluto de flor de laranjeira\nEntender como o método de extração muda o cheiro\nConstruir um acorde cítrico-floral\nCriar sua fórmula autoral","prereq":"Introdução à Perfumaria ou equivalente","naoE":"você busca um primeiro contato com perfumaria."}'),
  ('kit-mon-jardin', true, '{"kind":"kit","grupo":"criacao","cor":"jardin","titulo":"MON JARDIN","resumo":"Território floral, frutado e verde. Matérias-primas luminosas para quem quer criar composições frescas, delicadas e vibrantes.","desc":"Floral, verde e luminoso. Flor de laranjeira, jasmim e notas herbáceas em uma assinatura viva, clara e sofisticada.","coracao":"Flor de laranjeira, jasmim"}'),
  ('kit-mon-bois', true, '{"kind":"kit","grupo":"criacao","cor":"bois","titulo":"MON BOIS","resumo":"Território amadeirado, resinoso e terroso. Matérias-primas com profundidade para quem quer criar composições densas, quentes e envolventes.","desc":"Madeira, resina e âmbar. Sândalo, cedro, patchouli e incenso constroem uma assinatura densa, quente e atemporal.","fundo":"Sândalo, cedro, patchouli, incenso"}'),
  ('meu-primeiro-kit', false, '{"kind":"kit","grupo":"treino","cor":"jardin","resumo":"O ponto de partida. Para quem nunca cheirou uma matéria-prima isolada e quer dar o primeiro passo na perfumaria."}'),
  ('curiosidades-da-perfumaria', false, '{"kind":"kit","grupo":"treino","cor":"bois","resumo":"Para quem já tem curiosidade e quer ir além. Matérias-primas que surpreendem e exercícios que ampliam o repertório."}'),
  ('kit-gourmand', false, '{"kind":"kit","grupo":"treino","cor":"heritage","resumo":"Baunilha, cacau, caramelo, especiarias doces. Um mergulho no território mais envolvente e acolhedor da perfumaria."}'),
  ('magnetique', true, '{"kind":"kit","grupo":"limitada","cor":"magnetic","resumo":"Presença, profundidade e rastro. Uma fragrância que ocupa o espaço com elegância e permanece na memória de quem cruza o seu caminho.","desc":"Presença, profundidade e rastro. Uma fragrância que ocupa o espaço com elegância e permanece na memória."}'),
  ('heritage', true, '{"kind":"kit","grupo":"limitada","cor":"heritage","resumo":"Raiz, identidade e sofisticação. Uma fragrância construída sobre camadas de memória — clássica na estrutura, contemporânea na assinatura.","desc":"Raiz, identidade e sofisticação. Camadas de memória — clássica na estrutura, contemporânea na assinatura."}')
) AS v(slug, soon, details)
WHERE p.slug = v.slug;

-- 4) Fotos do site num bucket próprio (leitura pública, envio só pela equipe)
INSERT INTO storage.buckets (id, name, public) VALUES ('site', 'site', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Fotos do site públicas" ON storage.objects FOR SELECT USING (bucket_id = 'site');
CREATE POLICY "Equipe envia fotos do site" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site' AND public.has_studio_access(auth.uid()));
CREATE POLICY "Equipe troca fotos do site" ON storage.objects FOR UPDATE USING (bucket_id = 'site' AND public.has_studio_access(auth.uid()));
CREATE POLICY "Equipe apaga fotos do site" ON storage.objects FOR DELETE USING (bucket_id = 'site' AND public.has_studio_access(auth.uid()));
