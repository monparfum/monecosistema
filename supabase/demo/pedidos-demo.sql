-- PEDIDOS DE DEMONSTRAÇÃO (fictícios) — para mostrar o fluxo de Operações a clientes.
-- Rodar no SQL Editor do Supabase. Pode rodar de novo: recria do zero.
-- Para apagar tudo depois: supabase/demo/pedidos-demo-apagar.sql
--
-- Cuidados já tomados:
--  * números começam com DEMO- (fáceis de achar e apagar);
--  * entram direto no estágio final (sem UPDATE), então NÃO geram lançamento no Financeiro nem baixa de estoque;
--  * itens sem vínculo com produto (estoque nunca muda, mesmo clicando nos botões);
--  * e-mail do "cliente" é comercial@experienciamon.com.br: se alguém clicar em Despachar, o aviso cai na caixa da própria MON;
--  * sem referência de pagamento: cancelar um pedido demo não tenta estornar nada no Stripe / Mercado Pago.

-- 1) Limpa a rodada anterior
DELETE FROM public.module_events WHERE subject_type = 'order' AND subject_id IN (SELECT id FROM public.orders WHERE order_number LIKE 'DEMO-%');
DELETE FROM public.fin_entries WHERE source_ref IN (SELECT 'order:' || id FROM public.orders WHERE order_number LIKE 'DEMO-%');
DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE order_number LIKE 'DEMO-%');
DELETE FROM public.orders WHERE order_number LIKE 'DEMO-%';

-- 2) Pedidos. user_id = primeiro admin, para aparecerem também em "Meus pedidos" (visão do cliente) quando o admin estiver logado.
INSERT INTO public.orders (
  order_number, user_id, email, status, created_at, updated_at,
  subtotal_cents, shipping_cents, total_cents, payment_method, requires_shipping,
  shipping_recipient, shipping_document, shipping_phone, shipping_line1, shipping_number, shipping_line2, shipping_district,
  shipping_city, shipping_state, shipping_postal_code, shipping_service, shipping_service_id, tracking_code)
SELECT v.num, (SELECT user_id FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1), 'comercial@experienciamon.com.br',
       v.status::public.order_status, now() - v.age::interval, now() - v.age::interval,
       v.subtotal, v.frete, v.subtotal + v.frete, v.metodo, v.fisico,
       v.nome, v.cpf, v.fone, v.rua, v.numero, v.compl, v.bairro, v.cidade, v.uf, v.cep, v.servico, v.servico_id, v.rastreio
FROM (VALUES
  -- num, status, idade, subtotal, frete, método, físico?, destinatário, cpf, fone, rua, nº, compl, bairro, cidade, uf, cep, serviço, id serviço ME, rastreio
  ('DEMO-1001', 'pending_payment', '40 minutes', 31720,  2490, 'stripe',      true,  'Mariana Albuquerque (demo)', '11122233344', '48999990001', 'Rua Bocaiúva',          '2100', 'Apto 302', 'Centro',        'Florianópolis',  'SC', '88015530', 'Correios SEDEX',  2,    NULL),
  ('DEMO-1002', 'paid',            '3 hours',    59800,  3280, 'mercadopago', true,  'Rafael Nogueira (demo)',     '22233344455', '11999990002', 'Rua Oscar Freire',      '900',  'Cj 51',    'Jardins',       'São Paulo',      'SP', '01426001', 'Jadlog .Package', 3,    NULL),
  ('DEMO-1003', 'processing',      '1 day',      66829,  2890, 'stripe',      true,  'Camila Furtado (demo)',      '33344455566', '21999990003', 'Rua Visconde de Pirajá','414',  NULL,       'Ipanema',       'Rio de Janeiro', 'RJ', '22410002', 'Correios PAC',    1,    NULL),
  ('DEMO-1004', 'shipped',         '4 days',     35780,  2650, 'mercadopago', true,  'Bruno Tavares (demo)',       '44455566677', '41999990004', 'Rua Padre Anchieta',    '1287', 'Sala 4',   'Bigorrilho',    'Curitiba',       'PR', '80730000', 'Correios SEDEX',  2,    'AA123456789BR'),
  ('DEMO-1005', 'delivered',       '12 days',    110990,    0, 'stripe',      true,  'Helena Prado (demo)',        '55566677788', '31999990005', 'Rua Fernandes Tourinho','470',  'Apto 1201','Savassi',       'Belo Horizonte', 'MG', '30112000', 'Correios SEDEX',  2,    'AA987654321BR'),
  ('DEMO-1006', 'delivered',       '2 days',     41500,     0, 'stripe',      false, 'Lucas Meirelles (demo)',     '66677788899', '51999990006', 'Av. Independência',     '925',  NULL,       'Independência', 'Porto Alegre',   'RS', '90035072', NULL,              NULL, NULL),
  ('DEMO-1007', 'cancelled',       '6 days',     31720,  2490, 'stripe',      true,  'Patrícia Lemos (demo)',      '77788899900', '61999990007', 'SQS 308 Bloco C',       's/n',  'Apto 204', 'Asa Sul',       'Brasília',       'DF', '70355030', 'Correios PAC',    1,    NULL)
) AS v(num, status, age, subtotal, frete, metodo, fisico, nome, cpf, fone, rua, numero, compl, bairro, cidade, uf, cep, servico, servico_id, rastreio);

-- 3) Itens (sem product_id de propósito)
INSERT INTO public.order_items (order_id, product_name, product_brand, quantity, unit_price_cents, line_total_cents, image_url)
SELECT o.id, v.nome, 'MON PARFUM', v.qtd, v.preco, v.qtd * v.preco, v.img
FROM (VALUES
  ('DEMO-1001', 'Kit para Treinamento Olfativo — Meu Primeiro Kit',        1, 31720,  '/img/kit.webp'),
  ('DEMO-1002', 'Marketing Olfativo: Cheiro, Emoção e Comportamento',      1, 59800,  '/img/cursos/curso-marketing-olfativo-cheiro-emocao-comportamento.webp'),
  ('DEMO-1003', 'Velas Perfumadas: da Fragrância à Chama',                 1, 66829,  '/img/cursos/curso-velas-perfumadas-online.webp'),
  ('DEMO-1004', 'Kit para Treinamento Olfativo — Notas Gourmand',          1, 35780,  '/img/kit.webp'),
  ('DEMO-1005', 'Baunilhas na Perfumaria: da Fava à Fórmula',              1, 110990, '/img/cursos/baunilhas-na-perfumaria.webp'),
  ('DEMO-1006', 'Perfumaria: Aspectos Legais e Regulatórios (on-line)',    1, 41500,  '/img/cursos/aspectos-legais-e-regulatorios.webp'),
  ('DEMO-1007', 'Kit para Treinamento Olfativo — Meu Primeiro Kit',        1, 31720,  '/img/kit.webp')
) AS v(num, nome, qtd, preco, img)
JOIN public.orders o ON o.order_number = v.num;

-- 4) Histórico com datas coerentes (troca o "Pedido criado" automático, que nasce com a hora de agora)
DELETE FROM public.module_events WHERE subject_type = 'order' AND subject_id IN (SELECT id FROM public.orders WHERE order_number LIKE 'DEMO-%');

INSERT INTO public.module_events (event_type, subject_type, subject_id, payload, created_at)
SELECT 'order.created', 'order', o.id,
       jsonb_build_object('order_number', o.order_number, 'status', 'pending_payment', 'total_cents', o.total_cents, 'email', o.email), o.created_at
FROM public.orders o WHERE o.order_number LIKE 'DEMO-%';

INSERT INTO public.module_events (event_type, subject_type, subject_id, payload, created_at)
SELECT 'order.status_changed', 'order', o.id,
       jsonb_build_object('order_number', o.order_number, 'from', v.de, 'to', v.para), o.created_at + v.depois::interval
FROM (VALUES
  ('DEMO-1002', 'pending_payment', 'paid',       '6 minutes'),
  ('DEMO-1003', 'pending_payment', 'paid',       '4 minutes'),
  ('DEMO-1003', 'paid',            'processing', '3 hours'),
  ('DEMO-1004', 'pending_payment', 'paid',       '9 minutes'),
  ('DEMO-1004', 'paid',            'processing', '5 hours'),
  ('DEMO-1004', 'processing',      'shipped',    '1 day 2 hours'),
  ('DEMO-1005', 'pending_payment', 'paid',       '3 minutes'),
  ('DEMO-1005', 'paid',            'processing', '2 hours'),
  ('DEMO-1005', 'processing',      'shipped',    '1 day'),
  ('DEMO-1005', 'shipped',         'delivered',  '5 days 4 hours'),
  ('DEMO-1006', 'pending_payment', 'paid',       '2 minutes'),
  ('DEMO-1006', 'paid',            'delivered',  '2 minutes'),
  ('DEMO-1007', 'pending_payment', 'paid',       '5 minutes'),
  ('DEMO-1007', 'paid',            'cancelled',  '1 day 3 hours')
) AS v(num, de, para, depois)
JOIN public.orders o ON o.order_number = v.num;

-- Conferência
SELECT order_number, status, total_cents, shipping_recipient, tracking_code FROM public.orders WHERE order_number LIKE 'DEMO-%' ORDER BY order_number;
