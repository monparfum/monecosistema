-- Extrator de leads corporativos (CRM › Prospecção): empresas encontradas no Google Maps,
-- por CNPJ (Receita/BrasilAPI) ou no site da empresa. Revisadas antes de virar oportunidade.
CREATE TABLE IF NOT EXISTS public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('google', 'cnpj', 'manual')),
  external_id text UNIQUE CHECK (char_length(external_id) <= 300),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 200),
  legal_name text CHECK (char_length(legal_name) <= 200),
  cnpj text CHECK (cnpj ~ '^\d{14}$'),
  category text CHECK (char_length(category) <= 200),
  size text CHECK (char_length(size) <= 60),
  address text CHECK (char_length(address) <= 300),
  city text CHECK (char_length(city) <= 80),
  state text CHECK (char_length(state) <= 40),
  phone text CHECK (char_length(phone) <= 40),
  email text CHECK (char_length(email) <= 200),
  website text CHECK (char_length(website) <= 300),
  rating numeric(2,1),
  reviews int,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(extra) <= 16000),
  search text CHECK (char_length(search) <= 200),
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'interessante', 'descartado', 'convertido')),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  notes text CHECK (char_length(notes) <= 1000),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS prospects_cnpj_key ON public.prospects (cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS prospects_status_idx ON public.prospects (status, created_at DESC);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.prospects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO authenticated;
GRANT ALL ON public.prospects TO service_role;
DROP POLICY IF EXISTS "Admins gerenciam prospecção" ON public.prospects;
CREATE POLICY "Admins gerenciam prospecção" ON public.prospects FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS prospects_touch ON public.prospects;
CREATE TRIGGER prospects_touch BEFORE UPDATE ON public.prospects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
