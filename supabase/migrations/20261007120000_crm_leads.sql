-- CRM corporativo: oportunidades (funil), empresas, contatos, eventos e histórico de atividades.
-- Formulários do site passam a gravar pelo servidor (valida, limita e avisa a equipe por e-mail).

-- Etapas do funil (concluido antigo => ganho)
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
UPDATE public.leads SET status = 'ganho' WHERE status = 'concluido';
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('novo', 'em_contato', 'proposta', 'negociacao', 'ganho', 'perdido'));

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_kind_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_kind_check
  CHECK (kind IN ('quiz', 'atelier', 'corporativo', 'contato', 'newsletter', 'manual'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS company text CHECK (char_length(company) <= 120),
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS value_cents int CHECK (value_cents IS NULL OR value_cents >= 0),
  ADD COLUMN IF NOT EXISTS next_action text CHECK (char_length(next_action) <= 200),
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text CHECK (char_length(lost_reason) <= 300),
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 20),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

UPDATE public.leads SET company = left(payload->>'empresa', 120) WHERE company IS NULL AND payload ? 'empresa';
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads(lower(email));

-- Site não grava mais direto (só via servidor com service_role)
DROP POLICY IF EXISTS "Site envia contatos" ON public.leads;
REVOKE INSERT ON public.leads FROM anon;
DROP POLICY IF EXISTS "Admins criam contatos" ON public.leads;
CREATE POLICY "Admins criam contatos" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Histórico (notas, ligações, WhatsApp, e-mail, reunião, mudanças de etapa)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('nota', 'ligacao', 'whatsapp', 'email', 'reuniao', 'etapa', 'sistema')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON public.lead_activities(lead_id, created_at DESC);
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
DROP POLICY IF EXISTS "Admins gerenciam atividades" ON public.lead_activities;
CREATE POLICY "Admins gerenciam atividades" ON public.lead_activities FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND author_id = auth.uid());

-- Registra mudanças de etapa/responsável automaticamente
CREATE OR REPLACE FUNCTION public.leads_track_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE labels jsonb := '{"novo":"Novo","em_contato":"Em contato","proposta":"Proposta enviada","negociacao":"Negociação","ganho":"Ganho","perdido":"Perdido"}';
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.closed_at := CASE WHEN NEW.status IN ('ganho', 'perdido') THEN now() END;
    INSERT INTO lead_activities (lead_id, kind, body, author_id)
    VALUES (NEW.id, 'etapa', format('%s → %s%s', labels->>OLD.status, labels->>NEW.status,
      CASE WHEN NEW.status = 'perdido' AND NEW.lost_reason IS NOT NULL THEN ' (' || NEW.lost_reason || ')' ELSE '' END), auth.uid());
  END IF;
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    INSERT INTO lead_activities (lead_id, kind, body, author_id)
    VALUES (NEW.id, 'sistema', 'Responsável: ' || coalesce((SELECT full_name FROM profiles WHERE id = NEW.owner_id), 'ninguém'), auth.uid());
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS leads_track_changes ON public.leads;
CREATE TRIGGER leads_track_changes BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.leads_track_changes();

-- =====================================================================
-- Empresas (contas corporativas), contatos e dados do evento
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.corporate_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 160),
  cnpj text CHECK (char_length(cnpj) <= 20),
  segment text CHECK (char_length(segment) <= 80),
  city text CHECK (char_length(city) <= 80),
  website text CHECK (char_length(website) <= 200),
  size text CHECK (char_length(size) <= 40),
  domain text CHECK (domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text CHECK (char_length(notes) <= 4000),
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS corporate_accounts_name_key ON public.corporate_accounts (lower(trim(name)));
CREATE INDEX IF NOT EXISTS corporate_accounts_domain_idx ON public.corporate_accounts (domain);

CREATE TABLE IF NOT EXISTS public.corporate_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  role text CHECK (char_length(role) <= 80),
  email text CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 200),
  phone text CHECK (char_length(phone) <= 40),
  is_primary boolean NOT NULL DEFAULT false,
  notes text CHECK (char_length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corporate_contacts_account_idx ON public.corporate_contacts (account_id);
CREATE UNIQUE INDEX IF NOT EXISTS corporate_contacts_email_key ON public.corporate_contacts (account_id, lower(email)) WHERE email IS NOT NULL;

ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.corporate_accounts, public.corporate_contacts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_accounts, public.corporate_contacts TO authenticated;
GRANT ALL ON public.corporate_accounts, public.corporate_contacts TO service_role;
DROP POLICY IF EXISTS "Admins gerenciam empresas" ON public.corporate_accounts;
CREATE POLICY "Admins gerenciam empresas" ON public.corporate_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins gerenciam contatos corporativos" ON public.corporate_contacts;
CREATE POLICY "Admins gerenciam contatos corporativos" ON public.corporate_contacts FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Oportunidade -> empresa + dados do evento
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.corporate_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_city text CHECK (char_length(event_city) <= 80),
  ADD COLUMN IF NOT EXISTS event_type text CHECK (char_length(event_type) <= 120),
  ADD COLUMN IF NOT EXISTS participants int CHECK (participants IS NULL OR participants BETWEEN 1 AND 100000);
CREATE INDEX IF NOT EXISTS leads_account_idx ON public.leads (account_id);

-- Notas também podem ser da empresa (sem oportunidade)
ALTER TABLE public.lead_activities ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.corporate_accounts(id) ON DELETE CASCADE;
ALTER TABLE public.lead_activities DROP CONSTRAINT IF EXISTS lead_activities_target_check;
ALTER TABLE public.lead_activities ADD CONSTRAINT lead_activities_target_check CHECK (lead_id IS NOT NULL OR account_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS lead_activities_account_idx ON public.lead_activities (account_id, created_at DESC);

-- Domínio corporativo do e-mail (ignora provedores pessoais)
CREATE OR REPLACE FUNCTION public.corporate_domain(_email text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN d = '' OR d = ANY (ARRAY['gmail.com','googlemail.com','hotmail.com','hotmail.com.br','outlook.com','outlook.com.br',
    'live.com','msn.com','yahoo.com','yahoo.com.br','icloud.com','me.com','bol.com.br','uol.com.br','terra.com.br','ig.com.br','globo.com',
    'proton.me','protonmail.com','aol.com']) OR d !~ '^[a-z0-9.-]+\.[a-z]{2,}$' THEN NULL ELSE d END
  FROM (SELECT lower(split_part(trim(coalesce(_email, '')), '@', 2)) AS d) x
$$;

-- Vincula a oportunidade à empresa (nome, contato ou domínio); ao ganhar, cria a empresa
CREATE OR REPLACE FUNCTION public.leads_link_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE dom text := public.corporate_domain(NEW.email);
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.event_date := coalesce(NEW.event_date, CASE WHEN NEW.payload->>'data_prevista' ~ '^\d{4}-\d{2}-\d{2}$' THEN (NEW.payload->>'data_prevista')::date END);
    NEW.participants := coalesce(NEW.participants, CASE WHEN NEW.payload->>'participantes' ~ '^[1-9]\d{0,4}$' THEN (NEW.payload->>'participantes')::int END);
    NEW.event_type := coalesce(NEW.event_type, left(nullif(NEW.payload->>'tipo_evento', ''), 120));
    NEW.event_city := coalesce(NEW.event_city, left(nullif(NEW.payload->>'cidade', ''), 80));
  END IF;
  IF NEW.kind NOT IN ('corporativo', 'manual') THEN RETURN NEW; END IF;

  IF NEW.account_id IS NULL THEN
    SELECT a.id INTO NEW.account_id FROM corporate_accounts a
     WHERE (nullif(trim(NEW.company), '') IS NOT NULL AND lower(trim(a.name)) = lower(trim(NEW.company)))
        OR a.id IN (SELECT c.account_id FROM corporate_contacts c WHERE lower(c.email) = lower(NEW.email))
        OR (dom IS NOT NULL AND a.domain = dom)
     ORDER BY (lower(trim(a.name)) = lower(trim(coalesce(NEW.company, '')))) DESC, a.created_at
     LIMIT 1;
  END IF;

  IF NEW.account_id IS NULL AND NEW.status = 'ganho' THEN
    INSERT INTO corporate_accounts (name, domain, owner_id, city)
    VALUES (left(coalesce(nullif(trim(NEW.company), ''), nullif(trim(NEW.name), ''), NEW.email), 160), dom, NEW.owner_id, NEW.event_city)
    ON CONFLICT ((lower(trim(name)))) DO UPDATE SET updated_at = now()
    RETURNING id INTO NEW.account_id;
  END IF;

  IF NEW.account_id IS NOT NULL THEN
    -- Pessoa da oportunidade vira contato da empresa
    INSERT INTO corporate_contacts (account_id, name, email, phone, is_primary)
    SELECT NEW.account_id, left(coalesce(nullif(trim(NEW.name), ''), NEW.email), 120), lower(NEW.email), NEW.phone,
           NOT EXISTS (SELECT 1 FROM corporate_contacts WHERE account_id = NEW.account_id)
    WHERE NOT EXISTS (SELECT 1 FROM corporate_contacts WHERE account_id = NEW.account_id AND lower(email) = lower(NEW.email));
    IF dom IS NOT NULL THEN
      UPDATE corporate_accounts SET domain = dom WHERE id = NEW.account_id AND domain IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS leads_link_account ON public.leads;
CREATE TRIGGER leads_link_account BEFORE INSERT OR UPDATE OF status, account_id, company, email ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_link_account();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS corporate_accounts_touch ON public.corporate_accounts;
CREATE TRIGGER corporate_accounts_touch BEFORE UPDATE ON public.corporate_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Oportunidades já existentes: dados do evento + vínculo (o UPDATE dispara o gatilho)
UPDATE public.leads SET
  event_date = CASE WHEN payload->>'data_prevista' ~ '^\d{4}-\d{2}-\d{2}$' THEN (payload->>'data_prevista')::date END,
  participants = CASE WHEN payload->>'participantes' ~ '^[1-9]\d{0,4}$' THEN (payload->>'participantes')::int END,
  event_type = left(nullif(payload->>'tipo_evento', ''), 120),
  event_city = left(nullif(payload->>'cidade', ''), 80)
WHERE kind = 'corporativo' AND event_date IS NULL AND participants IS NULL AND event_type IS NULL;
UPDATE public.leads SET account_id = NULL WHERE kind IN ('corporativo', 'manual') AND account_id IS NULL;
