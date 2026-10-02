-- E-commerce: cupons de desconto, frete e estoque configuráveis, ajuste de estoque com motivo.

-- ---------- Configurações da loja ----------
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS flat_shipping_cents int NOT NULL DEFAULT 2500 CHECK (flat_shipping_cents >= 0),
  ADD COLUMN IF NOT EXISTS free_shipping_min_cents int CHECK (free_shipping_min_cents IS NULL OR free_shipping_min_cents >= 0),
  ADD COLUMN IF NOT EXISTS low_stock_threshold int NOT NULL DEFAULT 5 CHECK (low_stock_threshold BETWEEN 0 AND 1000);
UPDATE public.company_settings SET free_shipping_min_cents = 35000 WHERE free_shipping_min_cents IS NULL;

-- ---------- Estoque: ajuste manual com observação ----------
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS note text CHECK (char_length(note) <= 200);

CREATE OR REPLACE FUNCTION public.log_stock_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _delta int := NEW.stock - CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.stock END;
BEGIN
  IF _delta = 0 THEN RETURN NEW; END IF;
  INSERT INTO public.stock_movements (product_id, delta, stock_after, reason, order_id, actor_user_id, note)
  VALUES (
    NEW.id, _delta, NEW.stock,
    coalesce(nullif(current_setting('app.stock_reason', true), ''), CASE WHEN TG_OP = 'INSERT' THEN 'initial' ELSE 'adjust' END),
    nullif(current_setting('app.stock_order', true), '')::uuid,
    auth.uid(),
    nullif(current_setting('app.stock_note', true), '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_stock(_product_id uuid, _delta int, _note text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _after int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  IF _delta = 0 OR abs(_delta) > 100000 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  PERFORM set_config('app.stock_reason', 'adjust', true);
  PERFORM set_config('app.stock_note', left(coalesce(btrim(_note), ''), 200), true);
  SELECT stock INTO _after FROM public.products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
  IF _after + _delta < 0 THEN RAISE EXCEPTION 'Estoque não pode ficar negativo (há % em estoque)', _after; END IF;
  UPDATE public.products SET stock = stock + _delta WHERE id = _product_id RETURNING stock INTO _after;
  RETURN _after;
END $$;
REVOKE ALL ON FUNCTION public.adjust_stock(uuid, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, int, text) TO authenticated;

-- ---------- Cupons ----------
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_-]{3,30}$'),
  description text CHECK (char_length(description) <= 200),
  kind text NOT NULL CHECK (kind IN ('percent', 'fixed', 'free_shipping')),
  value int NOT NULL DEFAULT 0 CHECK (value >= 0),
  min_subtotal_cents int NOT NULL DEFAULT 0 CHECK (min_subtotal_cents >= 0),
  max_uses int CHECK (max_uses IS NULL OR max_uses > 0),
  once_per_customer boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind <> 'percent' OR value BETWEEN 1 AND 100),
  CHECK (kind <> 'fixed' OR value > 0)
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coupons FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
DROP POLICY IF EXISTS "Admins gerenciam cupons" ON public.coupons;
CREATE POLICY "Admins gerenciam cupons" ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_cents int NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  ADD COLUMN IF NOT EXISTS coupon_code text;
CREATE INDEX IF NOT EXISTS orders_coupon_idx ON public.orders (coupon_code) WHERE coupon_code IS NOT NULL;

-- Valida o cupom para um subtotal (uso no checkout e dentro do place_order). Erro = mensagem para o cliente.
CREATE OR REPLACE FUNCTION public.coupon_discount(_code text, _subtotal int, _shipping int, _uid uuid)
RETURNS TABLE (code text, kind text, products_discount int, free_shipping boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons%ROWTYPE; _used int;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE coupons.code = upper(btrim(_code));
  IF NOT FOUND OR NOT c.active THEN RAISE EXCEPTION 'Cupom inválido'; END IF;
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN RAISE EXCEPTION 'Cupom ainda não está valendo'; END IF;
  IF c.ends_at IS NOT NULL AND now() > c.ends_at THEN RAISE EXCEPTION 'Cupom expirado'; END IF;
  IF _subtotal < c.min_subtotal_cents THEN
    RAISE EXCEPTION 'Cupom válido para compras a partir de R$ %', replace(to_char(c.min_subtotal_cents / 100.0, 'FM999999990.00'), '.', ',');
  END IF;
  IF c.max_uses IS NOT NULL THEN
    SELECT count(*) INTO _used FROM public.orders o WHERE o.coupon_code = c.code AND o.status <> 'cancelled';
    IF _used >= c.max_uses THEN RAISE EXCEPTION 'Cupom esgotado'; END IF;
  END IF;
  IF c.once_per_customer AND _uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.coupon_code = c.code AND o.user_id = _uid AND o.status <> 'cancelled'
  ) THEN RAISE EXCEPTION 'Você já usou este cupom'; END IF;

  code := c.code; kind := c.kind; free_shipping := c.kind = 'free_shipping';
  products_discount := CASE c.kind
    WHEN 'percent' THEN floor(_subtotal * c.value / 100.0)::int
    WHEN 'fixed' THEN least(c.value, _subtotal)
    ELSE 0 END;
  -- Pedido nunca sai de graça (o gateway exige valor)
  IF _subtotal - products_discount + (CASE WHEN free_shipping THEN 0 ELSE _shipping END) < 100 THEN
    products_discount := greatest(0, _subtotal + CASE WHEN free_shipping THEN 0 ELSE _shipping END - 100);
  END IF;
  RETURN NEXT;
END $$;
REVOKE ALL ON FUNCTION public.coupon_discount(text, int, int, uuid) FROM PUBLIC, anon, authenticated;

-- Prévia no checkout (o valor final é recalculado no place_order)
CREATE OR REPLACE FUNCTION public.preview_coupon(_code text, _items jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _subtotal int; r record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT coalesce(sum(p.price_cents * (e->>'quantity')::int), 0)::int INTO _subtotal
  FROM jsonb_array_elements(public.normalize_cart(_items)) e JOIN public.products p ON p.id = (e->>'product_id')::uuid AND p.active;
  SELECT * INTO r FROM public.coupon_discount(_code, _subtotal, 0, auth.uid());
  RETURN jsonb_build_object('code', r.code, 'kind', r.kind, 'products_discount', r.products_discount, 'free_shipping', r.free_shipping);
END $$;
REVOKE ALL ON FUNCTION public.preview_coupon(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_coupon(text, jsonb) TO authenticated;

-- ---------- place_order v4: cupom ----------
DROP FUNCTION IF EXISTS public.place_order(jsonb, jsonb, uuid);
CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _address jsonb, _quote_id uuid DEFAULT NULL, _coupon text DEFAULT NULL)
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
  _shipping int := 0;
  _pd int := 0;      -- desconto nos produtos
  _waived int := 0;  -- frete abonado pelo cupom
  _coupon_code text;
  _cp record;
  _ship boolean;
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
    SELECT p.name FROM _req r JOIN public.products p ON p.id = r.product_id
    WHERE p.delivery_type <> 'digital' AND p.stock < r.quantity
  LOOP
    RAISE EXCEPTION 'Estoque insuficiente: %', _line.name;
  END LOOP;

  SELECT EXISTS (SELECT 1 FROM _req r JOIN public.products p ON p.id = r.product_id WHERE p.delivery_type <> 'digital') INTO _ship;

  IF coalesce(btrim(_address->>'recipient'), '') = '' THEN RAISE EXCEPTION 'Informe o nome'; END IF;
  IF _doc !~ '^\d{11}$' THEN RAISE EXCEPTION 'CPF inválido'; END IF;

  IF _ship THEN
    IF coalesce(btrim(_address->>'line1'), '') = ''
       OR coalesce(btrim(_address->>'number'), '') = ''
       OR coalesce(btrim(_address->>'district'), '') = ''
       OR coalesce(btrim(_address->>'city'), '') = ''
       OR coalesce(btrim(_address->>'state'), '') !~ '^[A-Za-z]{2}$'
       OR _cep !~ '^\d{8}$' THEN
      RAISE EXCEPTION 'Endereço incompleto';
    END IF;
    SELECT * INTO _quote FROM public.shipping_quotes WHERE id = _quote_id AND user_id = _uid;
    IF NOT FOUND OR _quote.expires_at < now() THEN RAISE EXCEPTION 'Cotação de frete expirada, recalcule o frete'; END IF;
    IF _quote.postal_code <> _cep OR public.normalize_cart(_quote.items) <> public.normalize_cart(_items) THEN
      RAISE EXCEPTION 'Carrinho ou CEP mudou, recalcule o frete';
    END IF;
    _shipping := _quote.price_cents;
  END IF;

  SELECT sum(p.price_cents * r.quantity)::int INTO _subtotal
  FROM _req r JOIN public.products p ON p.id = r.product_id;

  -- Cupom: trava a linha para o limite de usos valer sob concorrência
  IF nullif(btrim(coalesce(_coupon, '')), '') IS NOT NULL THEN
    PERFORM 1 FROM public.coupons WHERE code = upper(btrim(_coupon)) FOR UPDATE;
    SELECT * INTO _cp FROM public.coupon_discount(_coupon, _subtotal, _shipping, _uid);
    _coupon_code := _cp.code;
    _pd := _cp.products_discount;
    IF _cp.free_shipping THEN _waived := _shipping; _shipping := 0; END IF;
  END IF;

  INSERT INTO public.orders (
    user_id, email, status, subtotal_cents, shipping_cents, discount_cents, coupon_code, total_cents, requires_shipping,
    shipping_recipient, shipping_line1, shipping_number, shipping_line2, shipping_district,
    shipping_city, shipping_state, shipping_postal_code, shipping_phone, shipping_document,
    shipping_service, shipping_service_id, payment_method
  ) VALUES (
    _uid, _email, 'pending_payment', _subtotal, _shipping, _pd + _waived, _coupon_code,
    _subtotal - _pd + _shipping,
    _ship,
    left(btrim(_address->>'recipient'), 120),
    CASE WHEN _ship THEN left(btrim(_address->>'line1'), 200) ELSE '' END,
    CASE WHEN _ship THEN left(btrim(_address->>'number'), 20) END,
    CASE WHEN _ship THEN nullif(left(btrim(coalesce(_address->>'line2', '')), 200), '') END,
    CASE WHEN _ship THEN left(btrim(_address->>'district'), 100) END,
    CASE WHEN _ship THEN left(btrim(_address->>'city'), 100) ELSE '' END,
    CASE WHEN _ship THEN upper(btrim(_address->>'state')) ELSE '' END,
    CASE WHEN _ship THEN _cep ELSE '' END,
    nullif(left(btrim(coalesce(_address->>'phone', '')), 30), ''),
    _doc,
    CASE WHEN _ship THEN _quote.service_name END,
    CASE WHEN _ship THEN _quote.service_id END,
    'stripe'
  ) RETURNING * INTO _order;

  INSERT INTO public.order_items (order_id, product_id, product_name, product_brand, unit_price_cents, quantity, line_total_cents, image_url)
  SELECT _order.id, p.id, p.name, p.brand, p.price_cents, r.quantity, p.price_cents * r.quantity, p.image_url
  FROM _req r JOIN public.products p ON p.id = r.product_id;

  DELETE FROM public.shipping_quotes WHERE user_id = _uid;

  RETURN jsonb_build_object('id', _order.id, 'order_number', _order.order_number);
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, uuid, text) TO authenticated;
