-- Correções: fin_sync_order (status enum), adjust_stock (mensagem), coupon_discount (R$ com vírgula)

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
