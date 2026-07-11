## Fase 2 — Integração viva entre módulos

Fase 1 entregou a estrutura. Fase 2 acende os fios que conectam os módulos: quando algo acontece no Commerce, os outros módulos **reagem de verdade** — persistindo no banco, não só na tela.

## Escopo

### 1. Core — barramento persistente

Nova tabela `module_events` (append-only) para virar o Log em Administração e alimentar timelines. Trigger em `orders` emite eventos automaticamente. O `emit()` do cliente (Fase 1) passa a espelhar em `module_events` via server function.

**Schema:**
- `module_events` — id, event_type, actor_user_id, subject_type, subject_id, payload jsonb, created_at
- RLS: SELECT só admin; INSERT via service role (server fn `logEvent`).
- Trigger `on_order_insert` insere `order.created`; trigger `on_order_status_change` insere `order.status_changed`.

### 2. Ops — Timeline real do pedido

- Nova rota `_ops/ops.pedidos.$id.tsx` (ficha do pedido) mostrando: dados, itens, endereço, **timeline** lida de `module_events` filtrada por `subject_id = order.id`.
- Botões de transição de status (Pagar → Em produção → Enviado → Entregue → Cancelar) atuando direto no `orders.status` — o trigger cuida do log.
- Lista `ops.pedidos.tsx` passa a linkar para a ficha (hoje aponta para `/admin/pedidos`).

### 3. CRM — Notas de cliente

- Nova tabela `customer_notes` (id, customer_id, author_user_id, body, created_at).
- RLS: admin lê/escreve todas.
- Ficha `crm.clientes.$id.tsx` ganha seção "Observações" funcional (adicionar/ver notas) no lugar do placeholder atual.

### 4. Academy — Matrícula automática

- Nova tabela `enrollments` (id, user_id, product_id, order_id, status: 'active'|'revoked', created_at).
- Trigger `on_order_paid`: quando `orders.status` vira `paid`, para cada `order_items` cujo produto tenha `category.slug = 'cursos'`, cria linha em `enrollments`.
- `academy.alunos.tsx` passa a listar `enrollments` reais com nome do curso + cliente.
- Card "Cursos" na ficha CRM passa a mostrar matrículas reais do cliente.

### 5. Administração — Logs vivos

- `administracao.logs.tsx` passa a ler `module_events` (últimos 100), com filtro por tipo e ator.
- Layout editorial: eyebrow timestamp, display event_type, subtexto payload resumido.

### 6. Marketing — Conversões reais no painel

- Dashboard `marketing.index.tsx`: as métricas "Conversões" e "Receita" passam a vir de `orders` (pagos últimos 30 dias). Seguidores/Leads/ROI ficam placeholder até canal ser conectado.

## O que NÃO entra nesta fase

- Emissão de etiqueta / integração com transportadoras.
- Provedor de IA em `marketing.ia.tsx`.
- Player de vídeo, upload de aulas, certificado emitido em Academy (apenas matrícula/acesso).
- Provedores de Email/WhatsApp em automações.
- Tabela de `campaigns` — segue placeholder até haver operação de marketing real.

## Migrações previstas (uma só)

Uma única migração cria `module_events`, `customer_notes`, `enrollments`, os triggers em `orders`, GRANTs e políticas RLS. Nada altera tabelas existentes.

## Detalhes técnicos

- Triggers ficam em `SECURITY DEFINER` com `search_path = public`, seguindo o padrão das funções atuais (`handle_new_user`, `has_role`).
- Server function `addCustomerNote` usa `requireSupabaseAuth` + checagem `has_role(admin)`.
- `enrollments` join com `products` (name) e `profiles` (full_name) — reaproveita o que já existe, sem duplicar dados de curso.
- Timeline lê `module_events.subject_type='order' AND subject_id=<uuid>`.

## Confirmação

Se aprovar, entrego migração + código em uma passada. Depois seguimos com Marketing (canais/campanhas com persistência) e Academy (aulas/vídeo/certificados) em fases dedicadas.