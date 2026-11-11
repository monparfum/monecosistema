-- Apaga TODOS os pedidos de demonstração (DEMO-…) e o que eles geraram (histórico e lançamentos no Financeiro).
-- Rodar no SQL Editor do Supabase antes de divulgar o site / fechar o mês.
DELETE FROM public.module_events WHERE subject_type = 'order' AND subject_id IN (SELECT id FROM public.orders WHERE order_number LIKE 'DEMO-%');
DELETE FROM public.fin_entries WHERE source_ref IN (SELECT 'order:' || id FROM public.orders WHERE order_number LIKE 'DEMO-%');
DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE order_number LIKE 'DEMO-%');
DELETE FROM public.orders WHERE order_number LIKE 'DEMO-%';

SELECT count(*) AS pedidos_demo_restantes FROM public.orders WHERE order_number LIKE 'DEMO-%';
