-- Checkout seguro: pedido criado só no servidor, preço/estoque lidos do banco.

-- 1) Cliente não grava mais orders/order_items direto (antes podia inserir preço e status arbitrários)
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;

-- 2) place_order: valida itens, trava produtos, calcula totais e cria pedido numa transação
CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _address jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _order public.orders%ROWTYPE;
  _subtotal int := 0;
  _shipping int;
  _line record;
  _missing int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  IF _email IS NULL THEN RAISE EXCEPTION 'Usuário sem email'; END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Carrinho inválido';
  END IF;

  IF coalesce(btrim(_address->>'recipient'), '') = ''
     OR coalesce(btrim(_address->>'line1'), '') = ''
     OR coalesce(btrim(_address->>'city'), '') = ''
     OR coalesce(btrim(_address->>'state'), '') !~ '^[A-Za-z]{2}$'
     OR regexp_replace(coalesce(_address->>'postal_code', ''), '\D', '', 'g') !~ '^\d{8}$' THEN
    RAISE EXCEPTION 'Endereço incompleto';
  END IF;

  -- Agrega quantidades por produto (evita duplicatas burlando estoque)
  DROP TABLE IF EXISTS _req;
  CREATE TEMP TABLE _req ON COMMIT DROP AS
  SELECT (e->>'product_id')::uuid AS product_id, sum((e->>'quantity')::int)::int AS quantity
  FROM jsonb_array_elements(_items) e
  GROUP BY 1;

  IF EXISTS (SELECT 1 FROM _req WHERE product_id IS NULL OR quantity IS NULL OR quantity < 1 OR quantity > 99) THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  -- Trava as linhas de produto para checagem de estoque consistente
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

  -- Regra provisória até integração com transportadora
  _shipping := CASE WHEN _subtotal >= 35000 THEN 0 ELSE 2500 END;

  INSERT INTO public.orders (
    user_id, email, status, subtotal_cents, shipping_cents, total_cents,
    shipping_recipient, shipping_line1, shipping_line2, shipping_city, shipping_state,
    shipping_postal_code, shipping_phone, payment_method
  ) VALUES (
    _uid, _email, 'pending_payment', _subtotal, _shipping, _subtotal + _shipping,
    left(btrim(_address->>'recipient'), 120),
    left(btrim(_address->>'line1'), 200),
    nullif(left(btrim(coalesce(_address->>'line2', '')), 200), ''),
    left(btrim(_address->>'city'), 100),
    upper(btrim(_address->>'state')),
    regexp_replace(_address->>'postal_code', '\D', '', 'g'),
    nullif(left(btrim(coalesce(_address->>'phone', '')), 30), ''),
    'stripe'
  ) RETURNING * INTO _order;

  INSERT INTO public.order_items (order_id, product_id, product_name, product_brand, unit_price_cents, quantity, line_total_cents, image_url)
  SELECT _order.id, p.id, p.name, p.brand, p.price_cents, r.quantity, p.price_cents * r.quantity, p.image_url
  FROM _req r JOIN public.products p ON p.id = r.product_id;

  RETURN jsonb_build_object('id', _order.id, 'order_number', _order.order_number);
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO authenticated;
