-- Produto digital/híbrido vinculado a cursos da área de membros (ids dos cursos de lá)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS member_course_ids uuid[] NOT NULL DEFAULT '{}',
  DROP COLUMN IF EXISTS member_access_ref;
