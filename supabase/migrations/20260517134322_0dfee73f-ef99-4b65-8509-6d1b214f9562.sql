-- Media advanced fields
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS folder text,
  ADD COLUMN IF NOT EXISTS alt_text text;

CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON public.media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_tags ON public.media_assets USING gin(tags);

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_studio_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','editor','reviewer')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_publish(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','reviewer')
  )
$$;

-- Trigger: only admin/reviewer can flip status to published
CREATE OR REPLACE FUNCTION public.enforce_publish_permission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    IF NOT public.can_publish(auth.uid()) THEN
      RAISE EXCEPTION 'Apenas Revisores ou Admins podem publicar páginas';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pages_enforce_publish ON public.pages;
CREATE TRIGGER pages_enforce_publish
BEFORE INSERT OR UPDATE OF status ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_permission();

-- RLS updates
DROP POLICY IF EXISTS "Admins manage pages" ON public.pages;
CREATE POLICY "Studio team manage pages" ON public.pages
  FOR ALL USING (public.has_studio_access(auth.uid()))
  WITH CHECK (public.has_studio_access(auth.uid()));

DROP POLICY IF EXISTS "Published pages are public" ON public.pages;
CREATE POLICY "Published pages public or studio" ON public.pages
  FOR SELECT USING (status = 'published' OR public.has_studio_access(auth.uid()));

DROP POLICY IF EXISTS "Admins manage blocks" ON public.page_blocks;
CREATE POLICY "Studio team manage blocks" ON public.page_blocks
  FOR ALL USING (public.has_studio_access(auth.uid()))
  WITH CHECK (public.has_studio_access(auth.uid()));

DROP POLICY IF EXISTS "Blocks of published pages are public" ON public.page_blocks;
CREATE POLICY "Blocks public or studio" ON public.page_blocks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pages p
            WHERE p.id = page_blocks.page_id
              AND (p.status = 'published' OR public.has_studio_access(auth.uid())))
  );

DROP POLICY IF EXISTS "Admins manage versions" ON public.page_versions;
CREATE POLICY "Studio team manage versions" ON public.page_versions
  FOR ALL USING (public.has_studio_access(auth.uid()))
  WITH CHECK (public.has_studio_access(auth.uid()));

DROP POLICY IF EXISTS "Admins manage media" ON public.media_assets;
CREATE POLICY "Studio team manage media" ON public.media_assets
  FOR ALL USING (public.has_studio_access(auth.uid()))
  WITH CHECK (public.has_studio_access(auth.uid()));