-- Módulo Financeiro: contas, plano de contas, lançamentos (a pagar/receber), anexos e integrações
-- automáticas com a loja (pedidos pagos) e o CRM (oportunidades ganhas).

CREATE TABLE IF NOT EXISTS public.fin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  kind text NOT NULL DEFAULT 'banco' CHECK (kind IN ('banco', 'caixa', 'gateway', 'cartao', 'investimento')),
  initial_balance_cents bigint NOT NULL DEFAULT 0,
  initial_date date NOT NULL DEFAULT current_date,
  system_key text UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  kind text NOT NULL CHECK (kind IN ('in', 'out')),
  dre_group text NOT NULL CHECK (dre_group IN (
    'receita', 'receita_financeira', 'deducoes', 'custos', 'pessoal', 'administrativas', 'comerciais', 'financeiras', 'investimentos', 'nao_operacional', 'transferencia')),
  system_key text UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS public.fin_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('in', 'out')),
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 1 AND 200),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  competence_date date NOT NULL DEFAULT current_date,
  due_date date NOT NULL DEFAULT current_date,
  paid_at date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  account_id uuid REFERENCES public.fin_accounts(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.fin_categories(id) ON DELETE SET NULL,
  cost_center text CHECK (cost_center IN ('Loja', 'Corporativo', 'Cursos', 'Marketing', 'Administrativo')),
  counterpart text CHECK (char_length(counterpart) <= 120),
  payment_method text CHECK (char_length(payment_method) <= 40),
  document text CHECK (char_length(document) <= 60),
  notes text CHECK (char_length(notes) <= 1000),
  attachment_path text CHECK (char_length(attachment_path) <= 300),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'loja', 'crm', 'importacao')),
  source_ref text UNIQUE CHECK (char_length(source_ref) <= 200),
  recurrence_id uuid,
  installment text CHECK (char_length(installment) <= 10),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'pago') = (paid_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS fin_entries_due_idx ON public.fin_entries (status, due_date);
CREATE INDEX IF NOT EXISTS fin_entries_comp_idx ON public.fin_entries (competence_date);
CREATE INDEX IF NOT EXISTS fin_entries_paid_idx ON public.fin_entries (paid_at);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['fin_accounts', 'fin_categories', 'fin_entries'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins gerenciam" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Admins gerenciam" ON public.%I FOR ALL USING (public.has_role(auth.uid(), %L)) WITH CHECK (public.has_role(auth.uid(), %L))', t, 'admin', 'admin');
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS fin_entries_touch ON public.fin_entries;
CREATE TRIGGER fin_entries_touch BEFORE UPDATE ON public.fin_entries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Comprovantes (privado; só admin)
INSERT INTO storage.buckets (id, name, public) VALUES ('finance', 'finance', false) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Admins leem comprovantes" ON storage.objects;
CREATE POLICY "Admins leem comprovantes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'finance' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins enviam comprovantes" ON storage.objects;
CREATE POLICY "Admins enviam comprovantes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'finance' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins apagam comprovantes" ON storage.objects;
CREATE POLICY "Admins apagam comprovantes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'finance' AND public.has_role(auth.uid(), 'admin'));

-- Contas e plano de contas iniciais
INSERT INTO public.fin_accounts (name, kind, system_key) VALUES
  ('Conta principal', 'banco', 'principal'),
  ('Caixa', 'caixa', 'caixa'),
  ('Mercado Pago', 'gateway', 'mercadopago'),
  ('Stripe', 'gateway', 'stripe')
ON CONFLICT (system_key) DO NOTHING;

INSERT INTO public.fin_categories (name, kind, dre_group, system_key) VALUES
  ('Vendas da loja (site)', 'in', 'receita', 'vendas_loja'),
  ('Eventos corporativos', 'in', 'receita', 'eventos_corporativos'),
  ('Cursos e workshops presenciais', 'in', 'receita', NULL),
  ('Experiências e Atelier Privé', 'in', 'receita', NULL),
  ('Outras receitas', 'in', 'receita', NULL),
  ('Rendimentos financeiros', 'in', 'receita_financeira', NULL),
  ('Aporte de sócios', 'in', 'nao_operacional', NULL),
  ('Impostos sobre vendas (DAS/Simples)', 'out', 'deducoes', NULL),
  ('Taxas de pagamento (Mercado Pago, cartão)', 'out', 'deducoes', NULL),
  ('Devoluções e estornos', 'out', 'deducoes', NULL),
  ('Matéria-prima e essências', 'out', 'custos', NULL),
  ('Frascos e embalagens', 'out', 'custos', NULL),
  ('Frete e envios', 'out', 'custos', NULL),
  ('Insumos para eventos', 'out', 'custos', NULL),
  ('Pró-labore', 'out', 'pessoal', NULL),
  ('Salários e encargos', 'out', 'pessoal', NULL),
  ('Freelancers e professores', 'out', 'pessoal', NULL),
  ('Aluguel e condomínio', 'out', 'administrativas', NULL),
  ('Energia, água e internet', 'out', 'administrativas', NULL),
  ('Contabilidade', 'out', 'administrativas', NULL),
  ('Software e assinaturas', 'out', 'administrativas', NULL),
  ('Outras despesas administrativas', 'out', 'administrativas', NULL),
  ('Marketing e anúncios', 'out', 'comerciais', NULL),
  ('Comissões', 'out', 'comerciais', NULL),
  ('Tarifas bancárias e juros', 'out', 'financeiras', NULL),
  ('Equipamentos e melhorias', 'out', 'investimentos', NULL),
  ('Retirada de sócios', 'out', 'nao_operacional', NULL),
  -- Fora do DRE: dinheiro mudando de conta (ex.: repasse do Mercado Pago para o banco)
  ('Transferência entre contas', 'in', 'transferencia', 'transfer_in'),
  ('Transferência entre contas', 'out', 'transferencia', 'transfer_out')
ON CONFLICT (kind, name) DO NOTHING;

-- ---------- Loja: pedido pago vira receita recebida; cancelado vira estorno ----------
CREATE OR REPLACE FUNCTION public.fin_sync_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _paid text[] := ARRAY['paid', 'processing', 'shipped', 'delivered'];
  _acc uuid;
BEGIN
  -- status é enum (order_status): compara como texto
  IF NEW.status::text = ANY(_paid) AND NOT (OLD.status::text = ANY(_paid)) THEN
    SELECT id INTO _acc FROM fin_accounts WHERE system_key = CASE NEW.payment_method WHEN 'mercadopago' THEN 'mercadopago' WHEN 'stripe' THEN 'stripe' ELSE 'principal' END;
    INSERT INTO fin_entries (kind, description, amount_cents, competence_date, due_date, paid_at, status, account_id, category_id,
                             cost_center, counterpart, payment_method, source, source_ref)
    VALUES ('in', 'Pedido ' || NEW.order_number, NEW.total_cents, current_date, current_date, current_date, 'pago', _acc,
            (SELECT id FROM fin_categories WHERE system_key = 'vendas_loja'), 'Loja',
            left(coalesce(nullif(NEW.shipping_recipient, ''), NEW.email), 120), NEW.payment_method, 'loja', 'order:' || NEW.id)
    ON CONFLICT (source_ref) DO UPDATE SET status = 'pago', paid_at = coalesce(fin_entries.paid_at, current_date), amount_cents = EXCLUDED.amount_cents;
  ELSIF NEW.status = 'cancelled' AND OLD.status::text = ANY(_paid) THEN
    UPDATE fin_entries SET status = 'cancelado', paid_at = NULL,
      notes = left(coalesce(notes || E'\n', '') || 'Pedido cancelado em ' || to_char(now(), 'DD/MM/YYYY') || ' (estorno ao cliente).', 1000)
    WHERE source_ref = 'order:' || NEW.id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS fin_sync_order ON public.orders;
CREATE TRIGGER fin_sync_order AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fin_sync_order();

-- ---------- CRM: oportunidade ganha vira conta a receber ----------
CREATE OR REPLACE FUNCTION public.fin_sync_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ref text := 'lead:' || NEW.id; _company text;
BEGIN
  IF NEW.kind NOT IN ('corporativo', 'manual') THEN RETURN NEW; END IF;
  IF NEW.status = 'ganho' AND coalesce(NEW.value_cents, 0) > 0 THEN
    SELECT name INTO _company FROM corporate_accounts WHERE id = NEW.account_id;
    _company := coalesce(_company, NEW.company, NEW.name, NEW.email);
    INSERT INTO fin_entries (kind, description, amount_cents, competence_date, due_date, status, account_id, category_id,
                             cost_center, counterpart, source, source_ref)
    VALUES ('in', left('Evento corporativo — ' || _company || coalesce(' (' || NEW.event_type || ')', ''), 200), NEW.value_cents,
            coalesce(NEW.event_date, current_date), coalesce(NEW.event_date, current_date + 30), 'pendente',
            (SELECT id FROM fin_accounts WHERE system_key = 'principal'), (SELECT id FROM fin_categories WHERE system_key = 'eventos_corporativos'),
            'Corporativo', left(_company, 120), 'crm', _ref)
    ON CONFLICT (source_ref) DO UPDATE SET
      amount_cents = CASE WHEN fin_entries.status = 'pago' THEN fin_entries.amount_cents ELSE EXCLUDED.amount_cents END,
      due_date = CASE WHEN fin_entries.status = 'pago' THEN fin_entries.due_date ELSE EXCLUDED.due_date END,
      competence_date = CASE WHEN fin_entries.status = 'pago' THEN fin_entries.competence_date ELSE EXCLUDED.competence_date END,
      status = CASE WHEN fin_entries.status = 'cancelado' THEN 'pendente' ELSE fin_entries.status END;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'ganho' AND NEW.status <> 'ganho' THEN
    UPDATE fin_entries SET status = 'cancelado' WHERE source_ref = _ref AND status = 'pendente';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS fin_sync_lead ON public.leads;
CREATE TRIGGER fin_sync_lead AFTER INSERT OR UPDATE OF status, value_cents, event_date ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.fin_sync_lead();

-- Histórico: pedidos já pagos e oportunidades já ganhas entram no financeiro
INSERT INTO public.fin_entries (kind, description, amount_cents, competence_date, due_date, paid_at, status, account_id, category_id,
                                cost_center, counterpart, payment_method, source, source_ref)
SELECT 'in', 'Pedido ' || o.order_number, o.total_cents, o.updated_at::date, o.updated_at::date, o.updated_at::date, 'pago',
       (SELECT id FROM public.fin_accounts WHERE system_key = CASE o.payment_method WHEN 'mercadopago' THEN 'mercadopago' WHEN 'stripe' THEN 'stripe' ELSE 'principal' END),
       (SELECT id FROM public.fin_categories WHERE system_key = 'vendas_loja'), 'Loja',
       left(coalesce(nullif(o.shipping_recipient, ''), o.email), 120), o.payment_method, 'loja', 'order:' || o.id
FROM public.orders o WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
ON CONFLICT (source_ref) DO NOTHING;
UPDATE public.leads SET value_cents = value_cents WHERE status = 'ganho' AND kind IN ('corporativo', 'manual') AND coalesce(value_cents, 0) > 0;

-- ---------- Receitas e despesas fixas/recorrentes ----------
CREATE TABLE IF NOT EXISTS public.fin_recurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('in', 'out')),
  description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 1 AND 200),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  generated_until date,
  account_id uuid REFERENCES public.fin_accounts(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.fin_categories(id) ON DELETE SET NULL,
  cost_center text CHECK (cost_center IN ('Loja', 'Corporativo', 'Cursos', 'Marketing', 'Administrativo')),
  counterpart text CHECK (char_length(counterpart) <= 120),
  payment_method text CHECK (char_length(payment_method) <= 40),
  notes text CHECK (char_length(notes) <= 1000),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
ALTER TABLE public.fin_recurrences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fin_recurrences FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_recurrences TO authenticated;
GRANT ALL ON public.fin_recurrences TO service_role;
DROP POLICY IF EXISTS "Admins gerenciam" ON public.fin_recurrences;
CREATE POLICY "Admins gerenciam" ON public.fin_recurrences FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- N-ésima ocorrência a partir do início (meses sempre contados do dia original: 31/01 -> 28/02 -> 31/03)
CREATE OR REPLACE FUNCTION public.fin_occurrence(_start date, _freq text, _n int)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _freq
    WHEN 'weekly' THEN _start + 7 * _n
    WHEN 'biweekly' THEN _start + 14 * _n
    ELSE (_start + make_interval(months => _n * CASE _freq WHEN 'monthly' THEN 1 WHEN 'bimonthly' THEN 2 WHEN 'quarterly' THEN 3 WHEN 'semiannual' THEN 6 ELSE 12 END))::date
  END
$$;

-- Gera os lançamentos de cada recorrência até o horizonte (idempotente: 1 lançamento por data)
CREATE OR REPLACE FUNCTION public.fin_generate_recurrences(_months int DEFAULT 12)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.fin_recurrences%ROWTYPE; _d date; _horizon date := (current_date + make_interval(months => least(greatest(_months, 1), 36)))::date; _n int := 0; _i int;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  FOR r IN SELECT * FROM fin_recurrences WHERE active AND (end_date IS NULL OR end_date >= coalesce(generated_until, start_date)) FOR UPDATE LOOP
    _i := 0; _d := r.start_date;
    WHILE _d <= least(_horizon, coalesce(r.end_date, _horizon)) AND _i < 600 LOOP
      IF r.generated_until IS NULL OR _d > r.generated_until THEN
        INSERT INTO fin_entries (kind, description, amount_cents, competence_date, due_date, status, account_id, category_id,
                                 cost_center, counterpart, payment_method, notes, source, source_ref, recurrence_id, created_by)
        VALUES (r.kind, r.description, r.amount_cents, _d, _d, 'pendente', r.account_id, r.category_id, r.cost_center, r.counterpart,
                r.payment_method, r.notes, 'manual', 'rec:' || r.id || ':' || _d, r.id, r.created_by)
        ON CONFLICT (source_ref) DO NOTHING;
        IF FOUND THEN _n := _n + 1; END IF;
      END IF;
      _i := _i + 1; _d := public.fin_occurrence(r.start_date, r.frequency, _i);
    END LOOP;
    UPDATE fin_recurrences SET generated_until = least(_horizon, coalesce(r.end_date, _horizon)) WHERE id = r.id;
  END LOOP;
  RETURN _n;
END $$;
REVOKE ALL ON FUNCTION public.fin_generate_recurrences(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fin_generate_recurrences(int) TO authenticated;
