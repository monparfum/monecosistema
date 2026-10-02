-- Tipos de produto: físico (expedição), digital (área de membros), híbrido (os dois)

DO $$ BEGIN
  CREATE TYPE public.product_delivery AS ENUM ('physical', 'digital', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS delivery_type public.product_delivery NOT NULL DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS member_access_ref text; -- id/slug do curso na área de membros

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS requires_shipping boolean NOT NULL DEFAULT true;

-- Estoque: produto digital não controla estoque
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
      WHERE oi.order_id = NEW.id AND p.delivery_type <> 'digital'
      GROUP BY oi.product_id, p.stock, p.name
    LOOP
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
    FROM (
      SELECT oi.product_id, sum(oi.quantity)::int AS qty
      FROM public.order_items oi JOIN public.products pp ON pp.id = oi.product_id
      WHERE oi.order_id = NEW.id AND pp.delivery_type <> 'digital'
      GROUP BY oi.product_id
    ) x
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

-- Matrícula: digital/híbrido pago => acesso ativo; cancelado => revogado
CREATE OR REPLACE FUNCTION public.on_order_paid_enroll()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT NULL
     AND NEW.status IN ('paid','processing','shipped','delivered')
     AND OLD.status NOT IN ('paid','processing','shipped','delivered') THEN
    INSERT INTO public.enrollments(user_id, product_id, order_id, status)
    SELECT NEW.user_id, oi.product_id, NEW.id, 'active'
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id AND p.delivery_type IN ('digital','hybrid')
    ON CONFLICT (user_id, product_id) DO UPDATE SET status = 'active', order_id = EXCLUDED.order_id;

    IF FOUND THEN
      PERFORM public.log_module_event('academy.enrolled_from_order', auth.uid(), 'order', NEW.id,
        jsonb_build_object('order_number', NEW.order_number, 'user_id', NEW.user_id));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.enrollments SET status = 'revoked' WHERE order_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

-- place_order v3: frete/endereço só quando há item físico ou híbrido
DROP FUNCTION IF EXISTS public.place_order(jsonb, jsonb, uuid);
CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _address jsonb, _quote_id uuid DEFAULT NULL)
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

  INSERT INTO public.orders (
    user_id, email, status, subtotal_cents, shipping_cents, total_cents, requires_shipping,
    shipping_recipient, shipping_line1, shipping_number, shipping_line2, shipping_district,
    shipping_city, shipping_state, shipping_postal_code, shipping_phone, shipping_document,
    shipping_service, shipping_service_id, payment_method
  ) VALUES (
    _uid, _email, 'pending_payment', _subtotal, _shipping, _subtotal + _shipping, _ship,
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

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, uuid) TO authenticated;
