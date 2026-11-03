-- Galeria de fotos nas publicações (principalmente notícias de eventos): lista ordenada de { url, alt }
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_gallery_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_gallery_check
  CHECK (jsonb_typeof(gallery) = 'array' AND jsonb_array_length(gallery) <= 40);

-- Exemplo: galeria na notícia do workshop corporativo
UPDATE public.posts SET gallery = '[
  {"url": "/img/corporativo.webp", "alt": "Daniela Bitelo conduzindo o workshop com as participantes"},
  {"url": "/img/sobre.webp", "alt": "Kit MON aberto com frascos e caixa da marca"},
  {"url": "/img/atelier.webp", "alt": "Daniela Bitelo avaliando fitas olfativas no ateliê"},
  {"url": "/img/manifesto.jpg", "alt": "Participante sentindo três fitas olfativas"},
  {"url": "/img/kit.webp", "alt": "Kit de matérias-primas MON"}
]'::jsonb
WHERE kind = 'noticia' AND slug = 'workshop-corporativo-reune-equipe-em-florianopolis' AND gallery = '[]'::jsonb;
