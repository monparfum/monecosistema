-- CHECK DE PRODUÇÃO — pedidos. Rodar inteiro no SQL Editor do Supabase. Pode rodar quantas vezes quiser.
--
-- Problema: a função fin_sync_order (Financeiro) no banco estava na versão antiga, que compara o status
-- do pedido (tipo order_status) com texto. Resultado: TODA mudança de status dava erro
-- "operator does not exist: order_status = text" — inclusive a confirmação automática de pagamento.
-- A correção já existia (migration 20261010130000) mas não tinha sido aplicada neste banco.

-- 1) Correção
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
  ELSIF NEW.status::text = 'cancelled' AND OLD.status::text = ANY(_paid) THEN
    UPDATE fin_entries SET status = 'cancelado', paid_at = NULL,
      notes = left(coalesce(notes || E'\n', '') || 'Pedido cancelado em ' || to_char(now(), 'DD/MM/YYYY') || ' (estorno ao cliente).', 1000)
    WHERE source_ref = 'order:' || NEW.id;
  END IF;
  RETURN NEW;
END $$;

-- 2) Teste real: percorre todos os status num pedido de teste e desfaz tudo no final (nada fica gravado).
--    Se algum gatilho ainda estiver quebrado, o erro aparece aqui com o nome da função.
DO $$
DECLARE _id uuid; _s text;
BEGIN
  INSERT INTO public.orders (order_number, email, status, subtotal_cents, total_cents, shipping_recipient, shipping_line1, shipping_city, shipping_state, shipping_postal_code)
  VALUES ('CHECK-PRODUCAO', 'comercial@experienciamon.com.br', 'pending_payment', 100, 100, 'Teste automático', 'Rua Teste', 'Florianópolis', 'SC', '88000000')
  RETURNING id INTO _id;
  FOREACH _s IN ARRAY ARRAY['paid', 'processing', 'shipped', 'delivered'] LOOP
    UPDATE public.orders SET status = _s::public.order_status WHERE id = _id;
  END LOOP;
  UPDATE public.orders SET status = 'cancelled' WHERE id = _id;
  DELETE FROM public.fin_entries WHERE source_ref = 'order:' || _id;
  DELETE FROM public.module_events WHERE subject_type = 'order' AND subject_id = _id;
  DELETE FROM public.orders WHERE id = _id;
  RAISE NOTICE 'OK: pedido passou por todos os status sem erro.';
END $$;

-- 3) Varredura: outras funções do banco com o mesmo tipo de comparação (esperado: nenhuma linha)
SELECT p.proname AS funcao_suspeita
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.prosrc ~* '(NEW|OLD)\.status\s*(=|<>)\s*ANY'
ORDER BY 1;

-- 4) Pedidos parados em "aguardando pagamento" (podem ter sido pagos enquanto o erro existia):
--    abra cada um em Operações › Pedidos e clique em "Conferir pagamento".
SELECT order_number, created_at::date AS criado_em, total_cents / 100.0 AS total, payment_method, email
FROM public.orders WHERE status = 'pending_payment' AND order_number NOT LIKE 'DEMO-%' ORDER BY created_at;
