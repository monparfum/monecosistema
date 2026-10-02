-- Estoque (movimentações, baixa/devolução automática) + dados de envio (peso/dimensões, endereço completo, cotações)

-- 1) Produto: SKU, peso, dimensões, alerta de estoque baixo
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku text UNIQUE,
  ADD COLUMN IF NOT EXISTS weight_g int NOT NULL DEFAULT 300 CHECK (weight_g > 0),
  ADD COLUMN IF NOT EXISTS length_cm int NOT NULL DEFAULT 16 CHECK (length_cm > 0),
  ADD COLUMN IF NOT EXISTS width_cm int NOT NULL DEFAULT 11 CHECK (width_cm > 0),
  ADD COLUMN IF NOT EXISTS height_cm int NOT NULL DEFAULT 6 CHECK (height_cm > 0),
  ADD COLUMN IF NOT EXISTS low_stock_threshold int NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0);

-- 2) Pedido: endereço completo, CPF, serviço de frete, etiqueta, controle de estoque aplicado
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_number text,
  ADD COLUMN IF NOT EXISTS shipping_district text,
  ADD COLUMN IF NOT EXISTS shipping_document text,
  ADD COLUMN IF NOT EXISTS shipping_service text,
  ADD COLUMN IF NOT EXISTS shipping_service_id int,
  ADD COLUMN IF NOT EXISTS shipping_label_id text,
  ADD COLUMN IF NOT EXISTS shipping_label_url text,
  ADD COLUMN IF NOT EXISTS stock_applied boolean NOT NULL DEFAULT false;

-- 3) Empresa: endereço completo do remetente
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_district text,
  ADD COLUMN IF NOT EXISTS address_complement text;

-- 4) Movimentações de estoque (append-only)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta int NOT NULL,
  stock_after int NOT NULL,
  reason text NOT NULL CHECK (reason IN ('initial','adjust','sale','cancel')),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON public.stock_movements(product_id, created_at DESC);
GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view stock movements" ON public.stock_movements
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Toda alteração de products.stock gera movimentação; motivo/pedido vêm do contexto da transação
CREATE OR REPLACE FUNCTION public.log_stock_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _delta int := NEW.stock - CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.stock END;
BEGIN
  IF _delta = 0 THEN RETURN NEW; END IF;
  INSERT INTO public.stock_movements (product_id, delta, stock_after, reason, order_id, actor_user_id)
  VALUES (
    NEW.id, _delta, NEW.stock,
    coalesce(nullif(current_setting('app.stock_reason', true), ''), CASE WHEN TG_OP = 'INSERT' THEN 'initial' ELSE 'adjust' END),
    nullif(current_setting('app.stock_order', true), '')::uuid,
    auth.uid()
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS products_stock_log_trg ON public.products;
CREATE TRIGGER products_stock_log_trg
AFTER INSERT OR UPDATE OF stock ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_stock_change();

-- Baixa ao pagar; devolução ao cancelar pedido que já tinha dado baixa
CREATE OR REPLACE FUNCTION public.apply_order_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NEW.status IN ('paid','processing','shipped','delivered') AND NOT OLD.stock_applied THEN
    PERFORM set_config('app.stock_reason', 'sale', true);
    PERFORM set_config('app.stock_order', NEW.id::text, true);
    FOR r IN
      SELECT oi.product_id, sum(oi.quantity)::int AS qty, p.stock, p.name
      FROM public.order_items oi JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
      GROUP BY oi.product_id, p.stock, p.name
    LOOP
      -- Venda paga nunca é bloqueada; se faltar estoque, registra alerta para o admin
      IF r.stock < r.qty THEN
        PERFORM public.log_module_event('stock.oversold', auth.uid(), 'order', NEW.id,
          jsonb_build_object('order_number', NEW.order_number, 'product', r.name, 'stock', r.stock, 'quantity', r.qty));
      END IF;
      UPDATE public.products SET stock = greatest(stock - r.qty, 0) WHERE id = r.product_id;
    END LOOP;
    NEW.stock_applied := true;
  ELSIF NEW.status = 'cancelled' AND OLD.stock_applied THEN
    PERFORM set_config('app.stock_reason', 'cancel', true);
    PERFORM set_config('app.stock_order', NEW.id::text, true);
    UPDATE public.products p SET stock = p.stock + x.qty
    FROM (SELECT product_id, sum(quantity)::int AS qty FROM public.order_items WHERE order_id = NEW.id AND product_id IS NOT NULL GROUP BY product_id) x
    WHERE p.id = x.product_id;
    NEW.stock_applied := false;
  ELSE
    RETURN NEW;
  END IF;
  PERFORM set_config('app.stock_reason', '', true);
  PERFORM set_config('app.stock_order', '', true);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS orders_stock_trg ON public.orders;
CREATE TRIGGER orders_stock_trg
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.apply_order_stock();

-- 5) Cotações de frete (gravadas só pelo servidor; o pedido usa o preço daqui)
CREATE TABLE IF NOT EXISTS public.shipping_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  postal_code text NOT NULL,
  items jsonb NOT NULL,
  service_id int,
  service_name text NOT NULL,
  price_cents int NOT NULL CHECK (price_cents >= 0),
  delivery_days int,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 hours'
);
GRANT ALL ON public.shipping_quotes TO service_role;
ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;

-- Normaliza carrinho: soma por produto, ordena (usado para conferir cotação x pedido)
CREATE OR REPLACE FUNCTION public.normalize_cart(_items jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('product_id', product_id, 'quantity', quantity) ORDER BY product_id), '[]'::jsonb)
  FROM (
    SELECT (e->>'product_id')::uuid AS product_id, sum((e->>'quantity')::int)::int AS quantity
    FROM jsonb_array_elements(_items) e GROUP BY 1
  ) s
$$;

-- 6) place_order v2: endereço completo + CPF + frete vindo de cotação do servidor
DROP FUNCTION IF EXISTS public.place_order(jsonb, jsonb);
CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _address jsonb, _quote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _order public.orders%ROWTYPE;
  _quote public.shipping_quotes%ROWTYPE;
  _subtotal int := 0;
  _line record;
  _missing int;
  _cep text := regexp_replace(coalesce(_address->>'postal_code', ''), '\D', '', 'g');
  _doc text := regexp_replace(coalesce(_address->>'document', ''), '\D', '', 'g');
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  IF _email IS NULL THEN RAISE EXCEPTION 'Usuário sem email'; END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Carrinho inválido';
  END IF;

  IF coalesce(btrim(_address->>'recipient'), '') = ''
     OR coalesce(btrim(_address->>'line1'), '') = ''
     OR coalesce(btrim(_address->>'number'), '') = ''
     OR coalesce(btrim(_address->>'district'), '') = ''
     OR coalesce(btrim(_address->>'city'), '') = ''
     OR coalesce(btrim(_address->>'state'), '') !~ '^[A-Za-z]{2}$'
     OR _cep !~ '^\d{8}$' THEN
    RAISE EXCEPTION 'Endereço incompleto';
  END IF;
  IF _doc !~ '^\d{11}$' THEN RAISE EXCEPTION 'CPF inválido'; END IF;

  SELECT * INTO _quote FROM public.shipping_quotes WHERE id = _quote_id AND user_id = _uid;
  IF NOT FOUND OR _quote.expires_at < now() THEN RAISE EXCEPTION 'Cotação de frete expirada, recalcule o frete'; END IF;
  IF _quote.postal_code <> _cep OR public.normalize_cart(_quote.items) <> public.normalize_cart(_items) THEN
    RAISE EXCEPTION 'Carrinho ou CEP mudou, recalcule o frete';
  END IF;

  DROP TABLE IF EXISTS _req;
  CREATE TEMP TABLE _req ON COMMIT DROP AS
  SELECT (e->>'product_id')::uuid AS product_id, (e->>'quantity')::int AS quantity
  FROM jsonb_array_elements(public.normalize_cart(_items)) e;

  IF EXISTS (SELECT 1 FROM _req WHERE product_id IS NULL OR quantity IS NULL OR quantity < 1 OR quantity > 99) THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  PERFORM 1 FROM public.products p JOIN _req r ON r.product_id = p.id ORDER BY p.id FOR UPDATE OF p;

  SELECT count(*) INTO _missing
  FROM _req r LEFT JOIN public.products p ON p.id = r.product_id AND p.active
  WHERE p.id IS NULL;
  IF _missing > 0 THEN RAISE EXCEPTION 'Produto indisponível'; END IF;

  FOR _line IN
    SELECT p.name FROM _req r JOIN public.products p ON p.id = r.product_id WHERE p.stock < r.quantity
  LOOP
    RAISE EXCEPTION 'Estoque insuficiente: %', _line.name;
  END LOOP;

  SELECT sum(p.price_cents * r.quantity)::int INTO _subtotal
  FROM _req r JOIN public.products p ON p.id = r.product_id;

  INSERT INTO public.orders (
    user_id, email, status, subtotal_cents, shipping_cents, total_cents,
    shipping_recipient, shipping_line1, shipping_number, shipping_line2, shipping_district,
    shipping_city, shipping_state, shipping_postal_code, shipping_phone, shipping_document,
    shipping_service, shipping_service_id, payment_method
  ) VALUES (
    _uid, _email, 'pending_payment', _subtotal, _quote.price_cents, _subtotal + _quote.price_cents,
    left(btrim(_address->>'recipient'), 120),
    left(btrim(_address->>'line1'), 200),
    left(btrim(_address->>'number'), 20),
    nullif(left(btrim(coalesce(_address->>'line2', '')), 200), ''),
    left(btrim(_address->>'district'), 100),
    left(btrim(_address->>'city'), 100),
    upper(btrim(_address->>'state')),
    _cep,
    nullif(left(btrim(coalesce(_address->>'phone', '')), 30), ''),
    _doc,
    _quote.service_name, _quote.service_id,
    'stripe'
  ) RETURNING * INTO _order;

  INSERT INTO public.order_items (order_id, product_id, product_name, product_brand, unit_price_cents, quantity, line_total_cents, image_url)
  SELECT _order.id, p.id, p.name, p.brand, p.price_cents, r.quantity, p.price_cents * r.quantity, p.image_url
  FROM _req r JOIN public.products p ON p.id = r.product_id;

  DELETE FROM public.shipping_quotes WHERE user_id = _uid;

  RETURN jsonb_build_object('id', _order.id, 'order_number', _order.order_number);
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, uuid) TO authenticated;
