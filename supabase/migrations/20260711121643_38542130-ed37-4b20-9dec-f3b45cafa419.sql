-- Fase 2: barramento de eventos + notas CRM + matrículas Academy

-- 1) module_events (append-only log)
CREATE TABLE public.module_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX module_events_subject_idx ON public.module_events(subject_type, subject_id);
CREATE INDEX module_events_created_idx ON public.module_events(created_at DESC);
CREATE INDEX module_events_type_idx ON public.module_events(event_type);

GRANT SELECT ON public.module_events TO authenticated;
GRANT ALL ON public.module_events TO service_role;

ALTER TABLE public.module_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all events" ON public.module_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Log helper (SECURITY DEFINER so triggers/anon can insert safely)
CREATE OR REPLACE FUNCTION public.log_module_event(
  _event_type text,
  _actor uuid,
  _subject_type text,
  _subject_id uuid,
  _payload jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.module_events(event_type, actor_user_id, subject_type, subject_id, payload)
  VALUES (_event_type, _actor, _subject_type, _subject_id, coalesce(_payload, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- 2) Trigger: order.created e order.status_changed
CREATE OR REPLACE FUNCTION public.on_orders_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_module_event(
      'order.created', NEW.user_id, 'order', NEW.id,
      jsonb_build_object('order_number', NEW.order_number, 'status', NEW.status, 'total_cents', NEW.total_cents, 'email', NEW.email)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_module_event(
      'order.status_changed', auth.uid(), 'order', NEW.id,
      jsonb_build_object('order_number', NEW.order_number, 'from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_event_trg
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.on_orders_event();

-- 3) customer_notes
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_notes_customer_idx ON public.customer_notes(customer_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read notes" ON public.customer_notes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert notes" ON public.customer_notes
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') AND author_user_id = auth.uid());
CREATE POLICY "Admins delete notes" ON public.customer_notes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 4) enrollments
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
CREATE INDEX enrollments_user_idx ON public.enrollments(user_id);
CREATE INDEX enrollments_product_idx ON public.enrollments(product_id);

GRANT SELECT ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all enrollments" ON public.enrollments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: order pago => matrícula automática nos itens de categoria "cursos"
CREATE OR REPLACE FUNCTION public.on_order_paid_enroll()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.enrollments(user_id, product_id, order_id, status)
    SELECT NEW.user_id, oi.product_id, NEW.id, 'active'
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    JOIN public.categories c ON c.id = p.category_id
    WHERE oi.order_id = NEW.id
      AND c.slug = 'cursos'
      AND oi.product_id IS NOT NULL
    ON CONFLICT (user_id, product_id) DO NOTHING;

    PERFORM public.log_module_event(
      'academy.enrolled_from_order', auth.uid(), 'order', NEW.id,
      jsonb_build_object('order_number', NEW.order_number, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_paid_enroll_trg
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.on_order_paid_enroll();